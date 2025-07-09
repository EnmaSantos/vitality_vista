// frontend/src/api/workoutApi.ts

// API Base URL - Updated to be consistent with other API services
const API_BASE_URL = "https://enmanueldel-vitality-vi-71.deno.dev/api";

// A wrapper for fetch that includes authentication and error handling
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const data = await response.json();
    if (data.error === "Token has expired") {
      // Clear user session
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      
      // Redirect to login page
      window.location.href = '/login'; 
      
      // You might want to throw an error or return a specific response
      // to stop further execution in the calling function.
      throw new Error("Token expired");
    }
  }

  return response;
};

// Interfaces
export interface WorkoutPlan {
  plan_id: number;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
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

export interface UpdateWorkoutPlanPayload {
    name?: string;
    description?: string;
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

export interface WorkoutLog {
  log_id: number;
  user_id: string;
  plan_id?: number;
  workout_date: string;
  duration_seconds?: number;
  notes?: string;
}

export interface LogExerciseDetail {
  log_exercise_id: number;
  log_id: number;
  exercise_id: number;
  exercise_name: string;
  set_number: number;
  reps_achieved?: number;
  weight_kg_used?: number;
  duration_achieved_seconds?: number;
}

export interface CreateWorkoutLogPayload {
    plan_id?: number;
    workout_date: string; // YYYY-MM-DD
    duration_seconds?: number;
    notes?: string;
}

export interface LogExerciseDetailPayload {
    exercise_id: number;
    exercise_name: string;
    set_number: number;
    reps_achieved?: number;
    weight_kg_used?: number;
    duration_achieved_seconds?: number;
}

// API Functions

export const createWorkoutPlan = async (planData: CreateWorkoutPlanPayload, token: string | null): Promise<ApiResponse<WorkoutPlan>> => {
  if (!token) return { success: false, error: "No token provided for creating plan." };
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/workout-plans`, {
      method: 'POST',
      body: JSON.stringify(planData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error creating workout plan:", error);
    if (error instanceof Error && error.message === "Token expired") {
      return { success: false, error: "Your session has expired. Please log in again." };
    }
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const addExerciseToPlan = async (planId: number, exerciseData: AddExerciseToPlanPayload, token: string | null): Promise<ApiResponse<PlanExercise>> => {
  if (!token) return { success: false, error: "No token provided for adding exercise." };
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/workout-plans/${planId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(exerciseData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding exercise to plan:", error);
    if (error instanceof Error && error.message === "Token expired") {
      return { success: false, error: "Your session has expired. Please log in again." };
    }
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const getUserWorkoutPlans = async (token: string | null): Promise<ApiResponse<WorkoutPlan[]>> => {
  if (!token) return { success: false, error: "No token found for fetching plans" };
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/workout-plans`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching user workout plans:", error);
    if (error instanceof Error && error.message === "Token expired") {
      return { success: false, error: "Your session has expired. Please log in again." };
    }
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const getPlanExercises = async (planId: number, token: string | null): Promise<ApiResponse<PlanExercise[]>> => {
  if (!token) return { success: false, error: "No token found for fetching plan exercises" };
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/workout-plans/${planId}/exercises`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching plan exercises:", error);
    if (error instanceof Error && error.message === "Token expired") {
      return { success: false, error: "Your session has expired. Please log in again." };
    }
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const updateWorkoutPlan = async (
    planId: number, 
    planData: UpdateWorkoutPlanPayload, 
    token: string | null
): Promise<ApiResponse<WorkoutPlan>> => {
    if (!token) return { success: false, error: "No token provided for updating plan." };
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/workout-plans/${planId}`, {
            method: 'PUT',
            body: JSON.stringify(planData),
        });
        return await response.json();
    } catch (error) {
        console.error("Error updating workout plan:", error);
        if (error instanceof Error && error.message === "Token expired") {
            return { success: false, error: "Your session has expired. Please log in again." };
        }
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
    const response = await fetchWithAuth(`${API_BASE_URL}/workout-plans/${planId}`, {
      method: "DELETE",
    });
    const result = await response.json();
    console.log('[deleteWorkoutPlan] Response:', result);
    return result;
  } catch (error) {
    console.error("Error deleting workout plan:", error);
    if (error instanceof Error && error.message === "Token expired") {
      return { success: false, error: "Your session has expired. Please log in again." };
    }
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const removeExerciseFromPlan = async (planId: number, planExerciseId: number): Promise<ApiResponse<null>> => {
  const token = localStorage.getItem("authToken"); // Gets token from localStorage - FIXED KEY NAME
  if (!token) {
    return { success: false, error: "No token found in localStorage for removing exercise." };
  }
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/workout-plans/${planId}/exercises/${planExerciseId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Error removing exercise from plan:", error);
    if (error instanceof Error && error.message === "Token expired") {
      return { success: false, error: "Your session has expired. Please log in again." };
    }
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
    const response = await fetchWithAuth(`${API_BASE_URL}/workout-plans/${planId}/exercises/${planExerciseId}`, {
      method: "PUT",
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
    if (error instanceof Error && error.message === "Token expired") {
      return { success: false, error: "Your session has expired. Please log in again." };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error or unexpected issue updating exercise",
      message: error instanceof Error ? error.message : "Failed to update exercise in plan"
    };
  }
}; 

export const createWorkoutLog = async (
  logData: CreateWorkoutLogPayload,
  token: string | null
): Promise<ApiResponse<WorkoutLog>> => {
  if (!token) return { success: false, error: "No token provided." };
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/workout-logs`, {
      method: 'POST',
      body: JSON.stringify(logData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error creating workout log:", error);
    if (error instanceof Error && error.message === "Token expired") {
      return { success: false, error: "Your session has expired. Please log in again." };
    }
    return { success: false, error: "Network error" };
  }
};

export const logExerciseDetails = async (
  logId: number,
  exerciseData: LogExerciseDetailPayload,
  token: string | null
): Promise<ApiResponse<LogExerciseDetail>> => {
  if (!token) return { success: false, error: "No token provided." };
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/workout-logs/${logId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(exerciseData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error logging exercise details:", error);
    if (error instanceof Error && error.message === "Token expired") {
      return { success: false, error: "Your session has expired. Please log in again." };
    }
    return { success: false, error: "Network error" };
  }
}; 