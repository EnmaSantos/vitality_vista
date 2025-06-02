// frontend/src/api/workoutApi.ts

// Determine API_BASE_URL based on the environment
const getApiBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api'; // Backend running locally
  }
  // Replace with your deployed backend URL if necessary
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';
};

const API_BASE_URL = getApiBaseUrl();

// Interfaces
export interface WorkoutPlan {
  plan_id: number;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanExercise {
  plan_exercise_id: number;
  plan_id: number;
  exercise_id: number; 
  exercise_name: string;
  order_in_plan: number;
  sets?: number;
  reps?: string;
  weight_kg?: number;
  duration_minutes?: number;
  rest_period_seconds?: number;
  notes?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// DTOs for request bodies (matching backend expectations)
export interface CreateWorkoutPlanPayload {
  name: string;
  description?: string;
}

export interface AddExerciseToPlanPayload {
  exercise_id: number;
  exercise_name: string;
  sets?: number;
  reps?: string;
  weight_kg?: number;
  duration_minutes?: number;
  rest_period_seconds?: number;
  notes?: string;
}

// New DTO type for frontend, matching backend's UpdatePlanExerciseRequest
export interface UpdatePlanExerciseData {
  sets?: number;
  reps?: string;
  weight_kg?: number;
  duration_minutes?: number;
  rest_period_seconds?: number;
  notes?: string;
  // order_in_plan?: number; // if reordering is implemented
}

// API Functions

export const createWorkoutPlan = async (planData: CreateWorkoutPlanPayload, token: string | null): Promise<ApiResponse<WorkoutPlan>> => {
  if (!token) return { success: false, error: "No token provided for creating plan." };
  try {
    const response = await fetch(`${API_BASE_URL}/workout-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(planData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error creating workout plan:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const addExerciseToPlan = async (planId: number, exerciseData: AddExerciseToPlanPayload, token: string | null): Promise<ApiResponse<PlanExercise>> => {
  if (!token) return { success: false, error: "No token provided for adding exercise." };
  try {
    const response = await fetch(`${API_BASE_URL}/workout-plans/${planId}/exercises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(exerciseData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding exercise to plan:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const getUserWorkoutPlans = async (token: string | null): Promise<ApiResponse<WorkoutPlan[]>> => {
  if (!token) return { success: false, error: "No token found for fetching plans" };
  try {
    const response = await fetch(`${API_BASE_URL}/workout-plans`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching user workout plans:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const getPlanExercises = async (planId: number, token: string | null): Promise<ApiResponse<PlanExercise[]>> => {
  if (!token) return { success: false, error: "No token found for fetching plan exercises" };
  try {
    const response = await fetch(`${API_BASE_URL}/workout-plans/${planId}/exercises`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching plan exercises:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const deleteWorkoutPlan = async (planId: number): Promise<ApiResponse<null>> => {
  console.log('[deleteWorkoutPlan] Attempting to get token from localStorage');
  const token = localStorage.getItem("authToken"); // Gets token from localStorage - FIXED KEY NAME
  console.log('[deleteWorkoutPlan] Token retrieved:', token);
  console.log('[deleteWorkoutPlan] All localStorage keys:', Object.keys(localStorage));
  
  if (!token) {
    return { success: false, error: "No token found in localStorage for deleting plan." };
  }
  try {
    console.log(`[deleteWorkoutPlan] Making DELETE request to: ${API_BASE_URL}/workout-plans/${planId}`);
    const response = await fetch(`${API_BASE_URL}/workout-plans/${planId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    console.log('[deleteWorkoutPlan] Response:', result);
    return result;
  } catch (error) {
    console.error("Error deleting workout plan:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const removeExerciseFromPlan = async (planId: number, planExerciseId: number): Promise<ApiResponse<null>> => {
  const token = localStorage.getItem("authToken"); // Gets token from localStorage - FIXED KEY NAME
  if (!token) {
    return { success: false, error: "No token found in localStorage for removing exercise." };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/workout-plans/${planId}/exercises/${planExerciseId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error removing exercise from plan:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const updatePlanExercise = async (
  planId: number, 
  planExerciseId: number, 
  updateData: UpdatePlanExerciseData
): Promise<ApiResponse<PlanExercise>> => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return { success: false, error: "No token found in localStorage for updating exercise." };
  }

  console.log(`[updatePlanExercise] Updating exercise ${planExerciseId} in plan ${planId} with data:`, updateData);

  try {
    const response = await fetch(`${API_BASE_URL}/workout-plans/${planId}/exercises/${planExerciseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
    
    const result: ApiResponse<PlanExercise> = await response.json();
    console.log("[updatePlanExercise] Response:", result);
    
    if (!response.ok) {
        // Use error from API response if available, otherwise default
        throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
    }
    return result; // Expecting the updated PlanExercise object back

  } catch (error) {
    console.error("Error updating plan exercise:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error or unexpected issue updating exercise",
      message: error instanceof Error ? error.message : "Failed to update exercise in plan"
    };
  }
}; 