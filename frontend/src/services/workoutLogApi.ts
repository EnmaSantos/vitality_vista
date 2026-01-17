// API Base URL - Updated to be consistent with other API services
import { API_BASE_URL } from "../config";

// Interfaces
export interface WorkoutLog {
  log_id: number;
  user_id: string;
  plan_id: number | null;
  log_date: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  plan_name?: string;
}

export interface LogExerciseDetail {
  log_exercise_id: number;
  log_id: number;
  exercise_id: number;
  exercise_name: string;
  order_in_log: number;
  set_number: number;
  reps_achieved: number | null;
  weight_kg_used: number | null;
  duration_achieved_seconds: number | null;
  calories_burned: number | null;
  notes: string | null;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WorkoutSummary {
  totalWorkoutTime: number; // in minutes
  totalCaloriesBurned: number;
  exercisesCompleted: number;
  workoutSessions: number;
  exerciseBreakdown: {
    strength: { time: number; calories: number };
    cardio: { time: number; calories: number };
    stretching: { time: number; calories: number };
  };
}

// MET (Metabolic Equivalent of Task) values for different exercise types
const MET_VALUES = {
  strength: 3.5, // Light to moderate resistance training
  cardio: 7.0,   // Moderate cardio (running 6 mph equivalent)
  stretching: 2.5 // Stretching, hatha yoga
};

/**
 * Calculate calories burned using MET formula
 * Calories = MET × weight(kg) × duration(hours)
 */
function calculateCaloriesBurned(
  exerciseType: 'strength' | 'cardio' | 'stretching',
  durationMinutes: number,
  weightKg: number
): number {
  const met = MET_VALUES[exerciseType];
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}

/**
 * Determine exercise type from category string
 */
function getExerciseType(category: string | undefined): 'strength' | 'cardio' | 'stretching' {
  if (!category) return 'strength';
  const cat = category.toLowerCase();
  if (cat.includes('cardio') || cat.includes('cardiovascular')) return 'cardio';
  if (cat.includes('stretch') || cat.includes('flexibility')) return 'stretching';
  return 'strength';
}

/**
 * Creates a new workout log (session)
 */
export async function createWorkoutLog(
  logData: { plan_id?: number; duration_minutes?: number; notes?: string },
  token: string
): Promise<WorkoutLog> {
  console.log('Creating workout log:', logData);
  
  try {
    const response = await fetch(`${API_BASE_URL}/workout-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(logData),
    });

    const result: ApiResponse<WorkoutLog> = await response.json();
    console.log('Create workout log response:', result);

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || 'Failed to create workout log');
    }

    if (!result.data) {
      throw new Error('No data returned from create workout log API');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating workout log:', error);
    throw error;
  }
}

/**
 * Logs exercise details for a workout session
 */
export async function logExerciseDetail(
  logId: number,
  exerciseData: {
    exercise_id: number;
    exercise_name: string;
    set_number: number;
    reps_achieved?: number;
    weight_kg_used?: number;
    duration_achieved_seconds?: number;
    notes?: string;
  },
  token: string
): Promise<LogExerciseDetail> {
  console.log('Logging exercise detail:', { logId, exerciseData });
  
  try {
    const response = await fetch(`${API_BASE_URL}/workout-logs/${logId}/exercises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(exerciseData),
    });

    const result: ApiResponse<LogExerciseDetail> = await response.json();
    console.log('Log exercise detail response:', result);

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || 'Failed to log exercise detail');
    }

    if (!result.data) {
      throw new Error('No data returned from log exercise detail API');
    }

    return result.data;
  } catch (error) {
    console.error('Error logging exercise detail:', error);
    throw error;
  }
}

/**
 * Gets all workout logs for the authenticated user
 */
export async function getUserWorkoutLogs(token: string): Promise<WorkoutLog[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/workout-logs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result: ApiResponse<WorkoutLog[]> = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || 'Failed to fetch workout logs');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching workout logs:', error);
    throw error;
  }
}

/**
 * Gets detailed exercise logs for a specific workout log
 */
export async function getWorkoutLogDetails(logId: number, token: string): Promise<LogExerciseDetail[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/workout-logs/${logId}/exercises`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result: ApiResponse<LogExerciseDetail[]> = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || 'Failed to fetch workout log details');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching workout log details:', error);
    throw error;
  }
}

/**
 * Fetch today's workout summary with calorie calculations
 */
export async function getTodaysWorkoutSummary(
  token: string,
  userWeightKg?: number
): Promise<{ success: boolean; data?: WorkoutSummary; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch today's workout logs
    const response = await fetch(`${API_BASE_URL}/workout-logs?date=${today}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workout logs: ${response.status}`);
    }

    const workoutLogs = await response.json();
    console.log('getTodaysWorkoutSummary: Raw workout logs response:', workoutLogs);
    
    if (!workoutLogs.success || !Array.isArray(workoutLogs.data)) {
      console.log('getTodaysWorkoutSummary: No workout logs found or invalid format, returning empty summary');
      return { success: true, data: getEmptyWorkoutSummary() };
    }

    const logs = workoutLogs.data;

    // Initialize summary
    const summary: WorkoutSummary = {
      totalWorkoutTime: 0,
      totalCaloriesBurned: 0,
      exercisesCompleted: 0,
      workoutSessions: workoutLogs.length,
      exerciseBreakdown: {
        strength: { time: 0, calories: 0 },
        cardio: { time: 0, calories: 0 },
        stretching: { time: 0, calories: 0 }
      }
    };

    // Process each workout log
    console.log(`getTodaysWorkoutSummary: Processing ${logs.length} workout logs for today`);
    for (const log of logs) {
      // Fetch exercise details for this log
      const detailsResponse = await fetch(`${API_BASE_URL}/workout-logs/${log.log_id}/exercises`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (detailsResponse.ok) {
        const exerciseDetails = await detailsResponse.json();
        console.log('getTodaysWorkoutSummary: Exercise details for log', log.log_id, ':', exerciseDetails);
        
        if (Array.isArray(exerciseDetails)) {
          for (const detail of exerciseDetails) {
            summary.exercisesCompleted++;
            
            // Get duration (convert from seconds to minutes)
            const durationMinutes = Math.max(
              detail.duration_achieved_seconds ? Math.round(detail.duration_achieved_seconds / 60) : 0,
              1 // Minimum 1 minute per exercise
            );
            
            // Determine exercise type for breakdown categorization
            const exerciseType = getExerciseTypeFromExerciseName(detail.exercise_name);
            
            summary.totalWorkoutTime += durationMinutes;
            summary.exerciseBreakdown[exerciseType].time += durationMinutes;
            
            // Use stored calories_burned from database (calculated when exercise was logged)
            const caloriesBurned = parseFloat(String(detail.calories_burned)) || 0;
            console.log(`getTodaysWorkoutSummary: Using stored calories for ${detail.exercise_name}:`, {
              exerciseType,
              durationMinutes,
              storedCalories: caloriesBurned,
              detail: detail
            });
            
            summary.totalCaloriesBurned += caloriesBurned;
            summary.exerciseBreakdown[exerciseType].calories += caloriesBurned;
          }
        }
      }
    }

    console.log('getTodaysWorkoutSummary: Final summary calculated:', summary);
    return { success: true, data: summary };
  } catch (error) {
    console.error('Error fetching workout summary:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch workout summary' 
    };
  }
}

/**
 * Simple heuristic to determine exercise type from name
 * This could be improved by fetching the actual exercise data
 */
function getExerciseTypeFromExerciseName(exerciseName: string): 'strength' | 'cardio' | 'stretching' {
  const name = exerciseName.toLowerCase();
  
  // Cardio keywords
  if (name.includes('run') || name.includes('jog') || name.includes('cycle') || 
      name.includes('bike') || name.includes('swim') || name.includes('row') ||
      name.includes('jump') || name.includes('cardio') || name.includes('treadmill')) {
    return 'cardio';
  }
  
  // Stretching keywords
  if (name.includes('stretch') || name.includes('yoga') || name.includes('flexibility') ||
      name.includes('mobility') || name.includes('warm') || name.includes('cool')) {
    return 'stretching';
  }
  
  // Default to strength
  return 'strength';
}

/**
 * Return empty workout summary for days with no workouts
 */
function getEmptyWorkoutSummary(): WorkoutSummary {
  return {
    totalWorkoutTime: 0,
    totalCaloriesBurned: 0,
    exercisesCompleted: 0,
    workoutSessions: 0,
    exerciseBreakdown: {
      strength: { time: 0, calories: 0 },
      cardio: { time: 0, calories: 0 },
      stretching: { time: 0, calories: 0 }
    }
  };
} 