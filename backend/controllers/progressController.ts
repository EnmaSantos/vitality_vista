import { Context } from "../deps.ts";
import { type RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";
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
        SELECT exercise_name, duration_achieved_seconds, reps_achieved, weight_kg_used
        FROM log_exercise_details 
        WHERE log_id = $1
      `;
      const exerciseDetailsResult = await dbClient.queryObject<{
        exercise_name: string;
        duration_achieved_seconds: number | string | null;
        reps_achieved: number | string | null;
        weight_kg_used: number | string | null;
      }>(exerciseDetailsQuery, [log.log_id]);

      for (const detail of exerciseDetailsResult.rows) {
        // Calculate duration (minimum 1 minute per exercise)
        let durationMinutes = 1;
        if (detail.duration_achieved_seconds) {
          durationMinutes = Math.max(Math.round(parseFloat(String(detail.duration_achieved_seconds)) / 60), 1);
        } else {
          // Estimate duration for strength exercises based on sets/reps
          const reps = parseFloat(String(detail.reps_achieved)) || 0;
          const weight = parseFloat(String(detail.weight_kg_used)) || 0;
          if (reps > 0) {
            // Estimate 1-3 minutes per set based on weight/intensity
            durationMinutes = weight > 50 ? 3 : weight > 20 ? 2 : 1;
          }
        }

        // Determine exercise type and calculate calories
        const exerciseType = getExerciseTypeForCalories(detail.exercise_name);
        const caloriesBurned = calculateCaloriesBurned(exerciseType, durationMinutes, userWeight);
        
        summary.calories_burned += caloriesBurned;

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

    // Calculate net calories
    summary.net_calories = summary.calories_consumed - summary.calories_burned;

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

// TODO: Add handler for creating/logging a new body metric
// export async function logUserBodyMetricHandler(ctx: Context) { ... } 