// frontend/src/services/recipeApi.ts

// --- Types for Calorie Estimation ---
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

export interface ApiCalorieEstimateResponse {
  success: boolean;
  data?: RecipeCalorieEstimateData;
  message?: string;
}

// --- Types for General Recipe Fetching ---

// Summary of a recipe (e.g., from category lists or search results adapted for cards)
export interface RecipeSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

// Full details of a meal from TheMealDB, often returned by /lookup.php or /search.php
// Ensure this matches the structure your backend returns for full details.
export interface MealDbFullMeal {
  idMeal: string;
  strMeal: string;
  strDrinkAlternate?: string | null;
  strCategory?: string | null;
  strArea?: string | null;
  strInstructions?: string | null;
  strMealThumb?: string | null;
  strTags?: string | null;
  strYoutube?: string | null;
  strIngredient1?: string | null; strMeasure1?: string | null;
  strIngredient2?: string | null; strMeasure2?: string | null;
  strIngredient3?: string | null; strMeasure3?: string | null;
  strIngredient4?: string | null; strMeasure4?: string | null;
  strIngredient5?: string | null; strMeasure5?: string | null;
  strIngredient6?: string | null; strMeasure6?: string | null;
  strIngredient7?: string | null; strMeasure7?: string | null;
  strIngredient8?: string | null; strMeasure8?: string | null;
  strIngredient9?: string | null; strMeasure9?: string | null;
  strIngredient10?: string | null; strMeasure10?: string | null;
  strIngredient11?: string | null; strMeasure11?: string | null;
  strIngredient12?: string | null; strMeasure12?: string | null;
  strIngredient13?: string | null; strMeasure13?: string | null;
  strIngredient14?: string | null; strMeasure14?: string | null;
  strIngredient15?: string | null; strMeasure15?: string | null;
  strIngredient16?: string | null; strMeasure16?: string | null;
  strIngredient17?: string | null; strMeasure17?: string | null;
  strIngredient18?: string | null; strMeasure18?: string | null;
  strIngredient19?: string | null; strMeasure19?: string | null;
  strIngredient20?: string | null; strMeasure20?: string | null;
  strSource?: string | null;
  strImageSource?: string | null;
  strCreativeCommonsConfirmed?: string | null;
  dateModified?: string | null;
  [key: string]: any; // Allow dynamic access for strIngredientX etc.
}

// Response wrapper for a list of summaries (e.g., from getRecipesByCategory)
export interface ApiRecipeListResponse {
  success: boolean;
  data?: RecipeSummary[];
  message?: string;
}

// Response wrapper for a list of full meals (e.g., from search or featured)
export interface ApiFullMealListResponse {
    success: boolean;
    data?: MealDbFullMeal[];
    message?: string;
}

// Response wrapper for a single full meal (e.g., from getRecipeDetailsById)
export interface ApiSingleRecipeResponse {
    success: boolean;
    data?: MealDbFullMeal;
    message?: string;
}


// --- Service Functions ---

export async function getRecipeCalorieEstimate(
  recipeId: string,
  token: string
): Promise<ApiCalorieEstimateResponse> {
  const url = `/api/recipes/${recipeId}/estimate-calories`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
    const responseData: ApiCalorieEstimateResponse = await response.json();
    if (!response.ok) { throw new Error(responseData.message || `HTTP error! status: ${response.status}`); }
    if (!responseData.success) { throw new Error(responseData.message || `API error for calorie estimate`); }
    return responseData;
  } catch (error) {
    console.error(`Error fetching calorie estimate for recipe ${recipeId}:`, error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error." };
  }
}

export async function getRecipesByCategory(categoryName: string): Promise<ApiRecipeListResponse> {
  const encodedCategoryName = encodeURIComponent(categoryName);
  const url = `/api/recipes/category/${encodedCategoryName}`;
  console.log(`RecipeApi: Fetching category "${categoryName}" from ${url}`);
  try {
    const response = await fetch(url);
    const responseData: ApiRecipeListResponse = await response.json();
    if (!response.ok) { throw new Error(responseData.message || `HTTP error! status: ${response.status}`); }
    if (!responseData.success) { throw new Error(responseData.message || `API error for category ${categoryName}`); }
    return responseData;
  } catch (error) {
    console.error(`Error fetching recipes for category ${categoryName}:`, error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error.", data: [] };
  }
}

export async function getRecipeDetailsById(recipeId: string): Promise<ApiSingleRecipeResponse> {
    const url = `/api/recipes/${recipeId}`;
    console.log(`RecipeApi: Fetching full details for recipe ID "${recipeId}" from ${url}`);
    try {
        const response = await fetch(url);
        const responseData: ApiSingleRecipeResponse = await response.json();
        if (!response.ok) { throw new Error(responseData.message || `HTTP error! status: ${response.status}`); }
        if (!responseData.success || !responseData.data) { throw new Error(responseData.message || `API error fetching details for ${recipeId}`); }
        return responseData;
    } catch (error) {
        console.error(`Error fetching full details for recipe ${recipeId}:`, error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error." };
    }
}

export async function searchRecipesByNameFromApi(query: string): Promise<ApiFullMealListResponse> { // Expects full meals
    const encodedQuery = encodeURIComponent(query);
    const url = `/api/recipes/search?name=${encodedQuery}`;
    console.log(`RecipeApi: Searching recipes for "${query}" from ${url}`);
    try {
        const response = await fetch(url);
        const responseData: ApiFullMealListResponse = await response.json(); // Changed from ApiSearchResponse
        if (!response.ok) { throw new Error(responseData.message || `HTTP error! status: ${response.status}`); }
        if (!responseData.success) { throw new Error(responseData.message || `API error searching for "${query}"`); }
        return responseData;
    } catch (error) {
        console.error(`Error searching recipes for ${query}:`, error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error.", data: [] };
    }
}

// --- ADDED: Function to get featured recipes ---
export async function getFeaturedRecipes(): Promise<ApiFullMealListResponse> { // Expects full meals
  const url = `/api/recipes/featured`;
  console.log(`RecipeApi: Fetching featured recipes from ${url}`);
  try {
    const response = await fetch(url);
    const responseData: ApiFullMealListResponse = await response.json(); // Changed from ApiSearchResponse
    if (!response.ok) { throw new Error(responseData.message || `HTTP error! status: ${response.status}`); }
    if (!responseData.success) { throw new Error(responseData.message || `API error fetching featured recipes`); }
    return responseData;
  } catch (error) {
    console.error("Error fetching featured recipes:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error.", data: [] };
  }
}