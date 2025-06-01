export const deleteWorkoutPlan = async (planId: number): Promise<ApiResponse<null>> => {
  const token = localStorage.getItem("token");
  if (!token) {
    return { success: false, error: "No token found" };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/workout-plans/${planId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting workout plan:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
};

export const removeExerciseFromPlan = async (planId: number, planExerciseId: number): Promise<ApiResponse<null>> => {
  const token = localStorage.getItem("token");
  if (!token) {
    return { success: false, error: "No token found" };
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