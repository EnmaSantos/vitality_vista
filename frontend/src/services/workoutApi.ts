const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

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

/**
 * Creates a new workout plan for the authenticated user
 */
export async function createWorkoutPlan(planData: CreateWorkoutPlanRequest, token: string): Promise<WorkoutPlan> {
  console.log('createWorkoutPlan called with:', planData);
  
  const url = `${API_BASE_URL}workout-plans`;
  console.log('Making request to URL:', url);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(planData),
  });

  console.log('Response status:', response.status);

  const data = await response.json();
  console.log('Create workout plan response:', data);
  console.log('Response data type:', typeof data);
  console.log('Response data keys:', data ? Object.keys(data) : 'data is null/undefined');

  if (!response.ok) {
    console.error('Create workout plan failed:', data);
    throw new Error(data.message || `Failed to create workout plan: ${response.status}`);
  }

  console.log('data.data exists?', data && data.data); // Keep this log for now

  // Check if data itself or data.data (the plan object) is missing or not an object
  if (!data || typeof data.data !== 'object' || data.data === null) {
    console.error('Invalid response structure: data.data is missing or not an object. Expected structure like {success: true, data: {plan object}}, got:', data);
    throw new Error('Invalid response format from create workout plan API: plan data is missing or not an object.');
  }
  
  // Check if plan_id is missing or not a number within data.data
  // We need to cast data.data to 'any' or a partial type for this check if properties are not certain yet
  const planCandidate = data.data as any;
  if (typeof planCandidate.plan_id !== 'number') {
    console.error('Invalid plan object: plan_id is missing or not a number. Received plan object (data.data):', data.data);
    throw new Error('Invalid plan data from API: plan_id is missing or is not a number.');
  }
  
  return data.data as WorkoutPlan;
}

/**
 * Gets all workout plans for the authenticated user
 */
export async function getUserWorkoutPlans(token: string): Promise<WorkoutPlan[]> {
  const response = await fetch(`${API_BASE_URL}workout-plans`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch workout plans: ${response.status}`);
  }

  return data.data as WorkoutPlan[];
}

/**
 * Adds an exercise to a specific workout plan
 */
export async function addExerciseToWorkoutPlan(
  planId: number, 
  exerciseData: AddExerciseToPlanRequest, 
  token: string
): Promise<PlanExercise> {
  const response = await fetch(`${API_BASE_URL}workout-plans/${planId}/exercises`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(exerciseData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `Failed to add exercise to plan: ${response.status}`);
  }

  // Add detailed checks for data.data, similar to createWorkoutPlan
  if (!data || typeof data.data !== 'object' || data.data === null) {
    console.error('Invalid response structure from addExerciseToWorkoutPlan: data.data is missing or not an object. Expected {success: true, data: {plan exercise object}}, got:', data);
    throw new Error('Invalid response format from add exercise to plan API: plan exercise data is missing or not an object.');
  }

  // Check if plan_exercise_id is missing or not a number within data.data
  const planExerciseCandidate = data.data as any; // Cast to any for property check
  if (typeof planExerciseCandidate.plan_exercise_id !== 'number') {
    console.error('Invalid plan exercise object: plan_exercise_id is missing or not a number. Received object (data.data):', data.data);
    throw new Error('Invalid plan exercise data from API: plan_exercise_id is missing or is not a number.');
  }

  return data.data as PlanExercise;
} 