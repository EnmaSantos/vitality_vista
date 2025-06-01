// Determine API base URL: if running on localhost, point to local backend; otherwise use env var
const API_BASE_URL =
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:8000/api/'
    : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/');

// Interface for workout plan data
export interface WorkoutPlan {
  plan_id: number;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Interface for plan exercise data
export interface PlanExercise {
  plan_exercise_id: number;
  plan_id: number;
  exercise_id: number;
  exercise_name: string;
  order_in_plan: number;
  sets: number | null;
  reps: string | null;
  weight_kg: number | null;
  duration_minutes: number | null;
  rest_period_seconds: number | null;
  notes: string | null;
}

// Interface for creating a workout plan
export interface CreateWorkoutPlanRequest {
  name: string;
  description?: string;
}

// Interface for adding exercise to plan
export interface AddExerciseToPlanRequest {
  exercise_id: number;
  exercise_name: string;
  sets?: number;
  reps?: string;
  weight_kg?: number;
  duration_minutes?: number;
  rest_period_seconds?: number;
  notes?: string;
}

// Standard API response format
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Creates a new workout plan for the authenticated user
 */
export async function createWorkoutPlan(planData: CreateWorkoutPlanRequest, token: string): Promise<WorkoutPlan> {
  console.log('Creating workout plan with data:', planData);
  
  const url = `${API_BASE_URL}workout-plans`;
  console.log('Request URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(planData),
    });

    const result: ApiResponse<WorkoutPlan> = await response.json();
    console.log('API Response:', result);

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || `Failed to create workout plan: ${response.status}`);
    }

    if (!result.data) {
      throw new Error('No data returned from create workout plan API');
    }

    // Validate the response data
    if (typeof result.data.plan_id !== 'number') {
      console.error('Invalid plan_id in response:', result.data);
      throw new Error(`Invalid plan data: plan_id is ${typeof result.data.plan_id}, expected number`);
    }

    return result.data;
  } catch (error) {
    console.error('Error creating workout plan:', error);
    throw error;
  }
}

/**
 * Gets all workout plans for the authenticated user
 */
export async function getUserWorkoutPlans(token: string): Promise<WorkoutPlan[]> {
  try {
    const response = await fetch(`${API_BASE_URL}workout-plans`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result: ApiResponse<WorkoutPlan[]> = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || `Failed to fetch workout plans: ${response.status}`);
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching workout plans:', error);
    throw error;
  }
}

/**
 * Adds an exercise to a specific workout plan
 */
export async function addExerciseToWorkoutPlan(
  planId: number, 
  exerciseData: AddExerciseToPlanRequest, 
  token: string
): Promise<PlanExercise> {
  console.log('Adding exercise to plan:', { planId, exerciseData });
  
  try {
    const response = await fetch(`${API_BASE_URL}workout-plans/${planId}/exercises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(exerciseData),
    });

    const result: ApiResponse<PlanExercise> = await response.json();
    console.log('API Response:', result);
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || `Failed to add exercise to plan: ${response.status}`);
    }

    if (!result.data) {
      throw new Error('No data returned from add exercise API');
    }

    return result.data;
  } catch (error) {
    console.error('Error adding exercise to plan:', error);
    throw error;
  }
} 