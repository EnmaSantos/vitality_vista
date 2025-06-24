// Determine API base URL: if running on localhost, point to local backend; otherwise use env var
const API_BASE_URL =
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:8000/api'
    : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api');

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
  notes: string | null;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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