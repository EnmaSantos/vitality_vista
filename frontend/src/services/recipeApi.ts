// In frontend/src/services/recipeApi.ts or a types file

interface ParsedMeasureInfo {
    quantity: number | null;
    unit: string | null;
    estimatedGrams: number | null;
    parseNotes: string[];
  }
  
  export interface EstimatedIngredientDetail {
    ingredient: string;
    measure: string;
    status: string;
    fdcId?: number;
    caloriesPer100g?: number;
    parsedMeasureInfo?: ParsedMeasureInfo;
    calculatedCalories?: number;
    error?: string;
  }
  
  export interface RecipeCalorieEstimateData {
    recipeId: string;
    recipeName: string;
    estimatedTotalCalories: number;
    ingredients: EstimatedIngredientDetail[];
  }
  
  // For the overall API response structure
  export interface ApiCalorieEstimateResponse {
    success: boolean;
    data?: RecipeCalorieEstimateData;
    message?: string; // For errors
  }

const API_BASE_URL = "/api"; // Vite proxy will handle this

export async function getRecipeCalorieEstimate(
  recipeId: string,
  token: string
): Promise<ApiCalorieEstimateResponse> { // Use the interface for the expected response
  const url = `${API_BASE_URL}/recipes/${recipeId}/estimate-calories`; // Vite proxy handles the full URL

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json", // Good practice, though GET might not strictly need it
      },
    });

    const responseData: ApiCalorieEstimateResponse = await response.json();

    if (!response.ok) {
      // If the API returns a JSON error message, it will be in responseData.message
      throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    }
    return responseData;

  } catch (error) {
    console.error(`Error fetching calorie estimate for recipe ${recipeId}:`, error);
    // Return a structure that matches ApiCalorieEstimateResponse for error handling
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}