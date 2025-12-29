import { Context } from "../deps.ts";
import { RouterContext } from "../deps.ts";
import dbClient, { ensureConnection } from "../services/db.ts";
import { UserBodyMetricLogSchema } from "../models/userBodyMetricLog.model.ts";

// Consistent API Response Format
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Gets all metric logs for a specific metric type for the authenticated user.
 */
export async function getUserMetricLogsHandler(ctx: Context) {
  const response: ApiResponse<UserBodyMetricLogSchema[]> = { success: false };
  try {
    await ensureConnection();

    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }

    const metricType = ctx.params.metricType;
    if (!metricType || metricType.trim().length === 0) {
      ctx.response.status = 400;
      response.error = "Metric type is required";
      ctx.response.body = response;
      return;
    }

    console.log(`[progressController] Fetching metric logs for user: ${userId}, metric: ${metricType}`);

    const selectQuery = `
      SELECT log_id, user_id, metric_type, value, unit, TO_CHAR(log_date, 'YYYY-MM-DD') as log_date, notes, created_at, updated_at
      FROM user_body_metric_logs
      WHERE user_id = $1 AND metric_type = $2
      ORDER BY log_date ASC
    `; // Ordered ASC for charting (oldest to newest)

    const result = await dbClient.queryObject<UserBodyMetricLogSchema>(
      selectQuery,
      [userId, metricType]
    );

    response.success = true;
    response.data = result.rows;
    response.message = `Found ${result.rows.length} logs for metric type '${metricType}'`;
    ctx.response.status = 200;
    ctx.response.body = response;

  } catch (error) {
    console.error(`Error in getUserMetricLogsHandler (metric: ${ctx.params.metricType}):`, error);
    response.success = false;
    response.error = error instanceof Error ? error.message : "Unknown error occurred";
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

/**
 * Interface for daily calorie summary response
 */
interface DailyCalorieSummary {
  date: string;
  calories_consumed: number;
  calories_burned: number;
  net_calories: number;
  food_breakdown: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
  };
  exercise_breakdown: {
    strength: number;
    cardio: number;
    stretching: number;
  };
  macros: {
    protein_consumed: number;
    carbs_consumed: number;
    fat_consumed: number;
  };
}

/**
 * MET (Metabolic Equivalent of Task) values for exercise calorie calculation
 */
const MET_VALUES = {
  strength: 3.5, // Light to moderate resistance training
  cardio: 7.0,   // Moderate cardio (running 6 mph equivalent)
  stretching: 2.5, // Stretching, hatha yoga
  // Enhanced cardio types
  running: 8.0,  // Running 6 mph
  cycling: 7.5,  // Cycling moderate pace
  swimming: 6.0, // Swimming moderate pace
  walking: 3.5,  // Walking brisk pace
  rowing: 7.0,   // Rowing moderate pace
  hiit: 8.5,     // High-intensity interval training
  elliptical: 6.5 // Elliptical moderate pace
};

/**
 * Determine exercise type from name for calorie calculation
 */
function getExerciseTypeForCalories(exerciseName: string): keyof typeof MET_VALUES {
  const name = exerciseName.toLowerCase();

  // Specific cardio types
  if (name.includes('run') || name.includes('jog')) return 'running';
  if (name.includes('cycle') || name.includes('bike')) return 'cycling';
  if (name.includes('swim')) return 'swimming';
  if (name.includes('walk')) return 'walking';
  if (name.includes('row')) return 'rowing';
  if (name.includes('hiit') || name.includes('interval')) return 'hiit';
  if (name.includes('elliptical')) return 'elliptical';

  // General categories
  if (name.includes('cardio') || name.includes('treadmill')) return 'cardio';
  if (name.includes('stretch') || name.includes('yoga') || name.includes('flexibility')) return 'stretching';

  // Default to strength
  return 'strength';
}

/**
 * Calculate calories burned using MET formula
 * Calories = MET × weight(kg) × duration(hours)
 */
function calculateCaloriesBurned(
  exerciseType: keyof typeof MET_VALUES,
  durationMinutes: number,
  weightKg: number
): number {
  const met = MET_VALUES[exerciseType];
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}

/**
 * Get daily calorie summary including food intake and exercise burn
 * GET /api/progress/daily-calories?date=YYYY-MM-DD
 */
export async function getDailyCalorieSummaryHandler(ctx: RouterContext) {
  try {
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, error: "User not authenticated" };
      return;
    }

    // Get date from query params or use today
    let targetDate = ctx.request.url.searchParams.get("date");
    if (!targetDate) {
      const today = new Date();
      targetDate = today.toISOString().split('T')[0];
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: "Invalid date format. Use YYYY-MM-DD" };
      return;
    }

    // Get user weight for calorie calculation (fallback to 70kg if not available)
    const userProfileQuery = `
      SELECT weight_kg FROM user_profiles WHERE user_id = $1
    `;
    const profileResult = await dbClient.queryObject<{ weight_kg: number }>(userProfileQuery, [userId]);
    const userWeight = profileResult.rows[0]?.weight_kg || 70; // Default weight if not set

    // Initialize summary
    const summary: DailyCalorieSummary = {
      date: targetDate,
      calories_consumed: 0,
      calories_burned: 0,
      net_calories: 0,
      food_breakdown: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        snack: 0
      },
      exercise_breakdown: {
        strength: 0,
        cardio: 0,
        stretching: 0
      },
      macros: {
        protein_consumed: 0,
        carbs_consumed: 0,
        fat_consumed: 0
      }
    };

    // Get food log entries for the date
    const foodLogQuery = `
      SELECT meal_type, calories_consumed, protein_consumed, carbs_consumed, fat_consumed
      FROM food_log_entries 
      WHERE user_id = $1 AND log_date = $2
    `;
    const foodLogResult = await dbClient.queryObject<{
      meal_type: string;
      calories_consumed: number | string;
      protein_consumed: number | string;
      carbs_consumed: number | string;
      fat_consumed: number | string;
    }>(foodLogQuery, [userId, targetDate]);

    // Process food entries
    for (const entry of foodLogResult.rows) {
      const calories = parseFloat(String(entry.calories_consumed)) || 0;
      const protein = parseFloat(String(entry.protein_consumed)) || 0;
      const carbs = parseFloat(String(entry.carbs_consumed)) || 0;
      const fat = parseFloat(String(entry.fat_consumed)) || 0;

      summary.calories_consumed += calories;
      summary.macros.protein_consumed += protein;
      summary.macros.carbs_consumed += carbs;
      summary.macros.fat_consumed += fat;

      // Add to meal breakdown
      const mealType = entry.meal_type.toLowerCase() as keyof typeof summary.food_breakdown;
      if (summary.food_breakdown[mealType] !== undefined) {
        summary.food_breakdown[mealType] += calories;
      }
    }

    // Get workout logs for the date
    const workoutLogQuery = `
      SELECT log_id FROM workout_logs 
      WHERE user_id = $1 AND DATE(log_date) = $2
    `;
    const workoutLogResult = await dbClient.queryObject<{ log_id: number }>(workoutLogQuery, [userId, targetDate]);

    // Process workout logs and exercise details
    for (const log of workoutLogResult.rows) {
      const exerciseDetailsQuery = `
        SELECT exercise_name, duration_achieved_seconds, reps_achieved, weight_kg_used, calories_burned
        FROM log_exercise_details 
        WHERE log_id = $1
      `;
      const exerciseDetailsResult = await dbClient.queryObject<{
        exercise_name: string;
        duration_achieved_seconds: number | string | null;
        reps_achieved: number | string | null;
        weight_kg_used: number | string | null;
        calories_burned: number | string | null;
      }>(exerciseDetailsQuery, [log.log_id]);

      for (const detail of exerciseDetailsResult.rows) {
        // Use stored calories_burned from database (calculated when exercise was logged)
        const caloriesBurned = parseFloat(String(detail.calories_burned)) || 0;

        summary.calories_burned += caloriesBurned;

        // Determine exercise type for breakdown categorization
        const exerciseType = getExerciseTypeForCalories(detail.exercise_name);

        // Add to exercise breakdown
        if (exerciseType === 'running' || exerciseType === 'cycling' || exerciseType === 'swimming' ||
          exerciseType === 'walking' || exerciseType === 'rowing' || exerciseType === 'hiit' ||
          exerciseType === 'elliptical' || exerciseType === 'cardio') {
          summary.exercise_breakdown.cardio += caloriesBurned;
        } else if (exerciseType === 'stretching') {
          summary.exercise_breakdown.stretching += caloriesBurned;
        } else {
          summary.exercise_breakdown.strength += caloriesBurned;
        }
      }
    }

    // Calculate net calories (User requested to treat them separately, so we won't subtract burned from consumed)
    // We'll just return the consumed calories as the "net" for now, or the frontend can ignore this field.
    summary.net_calories = summary.calories_consumed;

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: summary,
      message: `Daily calorie summary for ${targetDate}`
    };

  } catch (error) {
    console.error("Error in getDailyCalorieSummaryHandler:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Get comprehensive progress data for charts and analysis
 * GET /api/progress?timeRange=week|month|quarter|year
 */
export async function getProgressDataHandler(ctx: RouterContext) {
  try {
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, error: "User not authenticated" };
      return;
    }

    const timeRange = ctx.request.url.searchParams.get("timeRange") || "month";

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "week":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "month":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "quarter":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`Fetching progress data for user ${userId}, range: ${timeRange} (${startDateStr} to ${endDateStr})`);

    // Get weight data
    console.log("Fetching weight data...");
    const weightQuery = `
      SELECT value, TO_CHAR(log_date, 'YYYY-MM-DD') as log_date
      FROM user_body_metric_logs 
      WHERE user_id = $1 AND metric_type = 'weight' 
      AND log_date >= $2 AND log_date <= $3
      ORDER BY log_date ASC
    `;
    const weightResult = await dbClient.queryObject<{ value: number; log_date: string }>(
      weightQuery, [userId, startDateStr, endDateStr]
    );
    console.log(`Weight data fetched: ${weightResult.rows.length} rows`);

    // Get body fat data
    console.log("Fetching body fat data...");
    const bodyFatQuery = `
      SELECT value, TO_CHAR(log_date, 'YYYY-MM-DD') as log_date
      FROM user_body_metric_logs 
      WHERE user_id = $1 AND metric_type = 'body_fat' 
      AND log_date >= $2 AND log_date <= $3
      ORDER BY log_date ASC
    `;
    const bodyFatResult = await dbClient.queryObject<{ value: number; log_date: string }>(
      bodyFatQuery, [userId, startDateStr, endDateStr]
    );
    console.log(`Body fat data fetched: ${bodyFatResult.rows.length} rows`);

    // Get daily calorie data
    console.log("Fetching calorie data...");
    const calorieQuery = `
      SELECT 
        DATE(log_date) as log_date,
        SUM(calories_consumed) as total_calories
      FROM food_log_entries 
      WHERE user_id = $1 AND log_date >= $2 AND log_date <= $3
      GROUP BY DATE(log_date)
      ORDER BY log_date ASC
    `;
    const calorieResult = await dbClient.queryObject<{ log_date: string; total_calories: number }>(
      calorieQuery, [userId, startDateStr, endDateStr]
    );
    console.log(`Calorie data fetched: ${calorieResult.rows.length} rows`);

    // Get workout data
    console.log("Fetching workout data...");
    const workoutQuery = `
      SELECT 
        DATE(wl.log_date) as log_date,
        COUNT(DISTINCT wl.log_id) as workout_count,
        SUM(COALESCE(led.duration_achieved_seconds, 0)) as total_duration_seconds,
        SUM(COALESCE(led.calories_burned, 0)) as total_calories_burned
      FROM workout_logs wl
      LEFT JOIN log_exercise_details led ON wl.log_id = led.log_id
      WHERE wl.user_id = $1 AND wl.log_date >= $2 AND wl.log_date <= $3
      GROUP BY DATE(wl.log_date)
      ORDER BY log_date ASC
    `;
    const workoutResult = await dbClient.queryObject<{
      log_date: string;
      workout_count: number;
      total_duration_seconds: number;
      total_calories_burned: number;
    }>(workoutQuery, [userId, startDateStr, endDateStr]);
    console.log(`Workout data fetched: ${workoutResult.rows.length} rows`);

    // Calculate summary statistics
    // Calculate summary statistics
    const currentWeight = weightResult.rows.length > 0 ? Number(weightResult.rows[weightResult.rows.length - 1].value) : null;
    const previousWeight = weightResult.rows.length > 1 ? Number(weightResult.rows[weightResult.rows.length - 2].value) : currentWeight;
    const weightChange = currentWeight && previousWeight ? currentWeight - previousWeight : 0;

    const currentBodyFat = bodyFatResult.rows.length > 0 ? Number(bodyFatResult.rows[bodyFatResult.rows.length - 1].value) : null;
    const previousBodyFat = bodyFatResult.rows.length > 1 ? Number(bodyFatResult.rows[bodyFatResult.rows.length - 2].value) : currentBodyFat;
    const bodyFatChange = currentBodyFat && previousBodyFat ? currentBodyFat - previousBodyFat : 0;

    const avgDailyCalories = calorieResult.rows.length > 0
      ? Math.round(calorieResult.rows.reduce((sum: number, row: { total_calories: any }) => sum + Number(row.total_calories), 0) / calorieResult.rows.length)
      : 0;

    const totalWorkouts = workoutResult.rows.reduce((sum: number, row: { workout_count: any }) => sum + Number(row.workout_count), 0);
    const workoutFrequency = timeRange === "week"
      ? totalWorkouts
      : Math.round((totalWorkouts / getDaysInRange(timeRange)) * 7);

    const progressData = {
      summary: {
        currentWeight: currentWeight ? Math.round(currentWeight * 2.20462 * 10) / 10 : "N/A", // Convert kg to lbs
        weightChange: Math.round(weightChange * 2.20462 * 10) / 10, // Convert kg to lbs
        bodyFatPercentage: currentBodyFat ? Math.round(currentBodyFat * 10) / 10 : "N/A",
        bodyFatChange: Math.round(bodyFatChange * 10) / 10,
        avgDailyCalories,
        calorieChange: 0, // Could calculate weekly trend
        workoutFrequency,
        workoutFrequencyChange: 0 // Could calculate weekly trend
      },
      charts: {
        weight: {
          labels: weightResult.rows.map(row => row.log_date),
          data: weightResult.rows.map(row => Math.round(Number(row.value) * 2.20462 * 10) / 10) // Convert to lbs
        },
        bodyFat: {
          labels: bodyFatResult.rows.map(row => row.log_date),
          data: bodyFatResult.rows.map(row => Math.round(Number(row.value) * 10) / 10)
        },
        calories: {
          labels: calorieResult.rows.map(row => row.log_date),
          data: calorieResult.rows.map(row => Math.round(Number(row.total_calories)))
        },
        workoutDuration: {
          labels: workoutResult.rows.map(row => row.log_date),
          data: workoutResult.rows.map(row => Math.round(Number(row.total_duration_seconds) / 60)) // Convert to minutes
        },
        workoutTypes: {
          labels: workoutResult.rows.map(row => row.log_date),
          strengthData: workoutResult.rows.map(row => Number(row.workout_count)), // Simplified for now
          cardioData: workoutResult.rows.map(() => 0),
          stretchingData: workoutResult.rows.map(() => 0)
        },
        macros: {
          labels: calorieResult.rows.map(row => row.log_date),
          proteinData: calorieResult.rows.map(() => 0), // Would need separate query
          carbsData: calorieResult.rows.map(() => 0),
          fatData: calorieResult.rows.map(() => 0)
        }
      },
      goals: {
        weight: {
          target: currentWeight ? currentWeight - 5 : 150, // Example goal
          progress: 65,
          remaining: 5
        }
      }
    };

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: progressData,
      message: `Progress data for ${timeRange} range`
    };

  } catch (error) {
    console.error("Error in getProgressDataHandler:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

function getDaysInRange(timeRange: string): number {
  switch (timeRange) {
    case "week": return 7;
    case "month": return 30;
    case "quarter": return 90;
    case "year": return 365;
    default: return 30;
  }
}

// TODO: Add handler for creating/logging a new body metric
// export async function logUserBodyMetricHandler(ctx: Context) { ... }

/**
 * Get exercise progress and PRs
 * GET /api/progress/exercises
 */
export async function getExerciseProgressHandler(ctx: RouterContext) {
  try {
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, error: "User not authenticated" };
      return;
    }

    console.log(`Fetching exercise progress for user ${userId}`);

    // Get overall stats per exercise
    const statsQuery = `
      SELECT 
        led.exercise_name,
        MAX(led.weight_kg_used) as max_weight,
        MAX(led.reps_achieved) as max_reps,
        MAX(led.duration_achieved_seconds) as max_duration,
        COUNT(*) as total_sessions,
        MAX(wl.log_date) as last_performed
      FROM log_exercise_details led
      JOIN workout_logs wl ON led.log_id = wl.log_id
      WHERE wl.user_id = $1
      GROUP BY led.exercise_name
      ORDER BY last_performed DESC
    `;

    const statsResult = await dbClient.queryObject<{
      exercise_name: string;
      max_weight: number | null;
      max_reps: number | null;
      max_duration: number | null;
      total_sessions: number;
      last_performed: Date;
    }>(statsQuery, [userId]);

    // Get detailed history for charts (all logs)
    // We might want to filter this by exercise if the dataset is large, but for now fetch all
    // so the frontend can filter/display charts for any selected exercise.
    const historyQuery = `
      SELECT 
        led.exercise_name,
        led.weight_kg_used,
        led.reps_achieved,
        led.duration_achieved_seconds,
        wl.log_date
      FROM log_exercise_details led
      JOIN workout_logs wl ON led.log_id = wl.log_id
      WHERE wl.user_id = $1
      ORDER BY wl.log_date ASC
    `;

    const historyResult = await dbClient.queryObject<{
      exercise_name: string;
      weight_kg_used: number | null;
      reps_achieved: number | null;
      duration_achieved_seconds: number | null;
      log_date: Date;
    }>(historyQuery, [userId]);

    // Group history by exercise
    const historyByExercise: Record<string, any[]> = {};
    for (const row of historyResult.rows) {
      if (!historyByExercise[row.exercise_name]) {
        historyByExercise[row.exercise_name] = [];
      }
      historyByExercise[row.exercise_name].push({
        date: row.log_date,
        weight: Number(row.weight_kg_used),
        reps: Number(row.reps_achieved),
        duration: Number(row.duration_achieved_seconds)
      });
    }

    // Convert stats BigInts to Numbers
    const stats = statsResult.rows.map(stat => ({
      ...stat,
      max_weight: Number(stat.max_weight),
      max_reps: Number(stat.max_reps),
      max_duration: Number(stat.max_duration),
      total_sessions: Number(stat.total_sessions)
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        stats: stats,
        history: historyByExercise
      }
    };

  } catch (error) {
    console.error("Error in getExerciseProgressHandler:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
} 