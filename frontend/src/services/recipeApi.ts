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