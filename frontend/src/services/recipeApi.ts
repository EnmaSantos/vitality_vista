// --- Types for FatSecret Recipe API ---

// Nutrition Summary (from search results)
interface FatSecretRecipeNutritionSummary {
    calories: string; // Note: API returns decimals as strings
    carbohydrate: string;
    protein: string;
    fat: string;
}

// Ingredient Summary (from search results)
interface FatSecretRecipeIngredientSummary {
    ingredient: string[]; // Array of ingredient names
}

// Type Summary (from search results)
interface FatSecretRecipeTypeSummary {
    recipe_type: string[]; // Array of recipe type names
}

// Recipe Summary (from search results)
export interface FatSecretRecipeSummary {
    recipe_id: string; // Use string for consistency, even if API doc says Long
    recipe_name: string;
    recipe_description: string;
    recipe_image: string; // URL
    recipe_nutrition: FatSecretRecipeNutritionSummary;
    recipe_ingredients: FatSecretRecipeIngredientSummary;
    recipe_types: FatSecretRecipeTypeSummary;
}

// Overall Search Response
interface FatSecretSearchData {
    recipes: {
        max_results: string;
        total_results: string;
        page_number: string;
        recipe: FatSecretRecipeSummary[]; // Array of recipes
    };
}

export interface ApiFatSecretSearchResponse {
    success: boolean;
    data?: FatSecretSearchData;
    message?: string;
}

// --- Types for FatSecret Get Recipe Details (v2) ---

// Category Detail
interface FatSecretRecipeCategoryDetail {
    recipe_category_name: string;
    recipe_category_url: string;
}

// Image Detail
interface FatSecretRecipeImageDetail {
    recipe_image: string[]; // Array of image URLs
}

// Serving Detail (Nutrition)
export interface FatSecretServingDetail {
    serving_size: string;
    calories: string;
    carbohydrate: string;
    protein: string;
    fat: string;
    saturated_fat?: string;
    polyunsaturated_fat?: string;
    monounsaturated_fat?: string;
    trans_fat?: string;
    cholesterol?: string;
    sodium?: string;
    potassium?: string;
    fiber?: string;
    sugar?: string;
    vitamin_a?: string;
    vitamin_c?: string;
    calcium?: string;
    iron?: string;
}

// Ingredient Detail
export interface FatSecretIngredientDetail {
    food_id: string;
    food_name: string;
    serving_id: string;
    number_of_units: string;
    measurement_description: string;
    ingredient_url: string;
    ingredient_description: string;
}

// Direction Detail
interface FatSecretDirectionDetail {
    direction_number: string;
    direction_description: string;
}

// Full Recipe Detail Structure
export interface FatSecretRecipeDetail {
    recipe_id: string;
    recipe_name: string;
    recipe_url: string;
    recipe_description: string;
    number_of_servings: string;
    grams_per_portion?: string; // Added in v2
    preparation_time_min?: string;
    cooking_time_min?: string;
    rating?: string;
    recipe_types?: { recipe_type: string[] }; // Nested array
    recipe_categories?: { recipe_category: FatSecretRecipeCategoryDetail[] }; // Nested array
    recipe_images?: { recipe_image: string[] }; // Nested array, consistent with example
    serving_sizes?: { serving: FatSecretServingDetail }; // API example shows single serving, wrap in object
    ingredients?: { ingredient: FatSecretIngredientDetail[] }; // Nested array
    directions?: { direction: FatSecretDirectionDetail[] }; // Nested array
}

// Overall Get Recipe Response
export interface ApiFatSecretGetRecipeResponse {
    success: boolean;
    data?: { recipe: FatSecretRecipeDetail }; // API response nests detail under 'recipe'
    message?: string;
}

// --- Types for FatSecret Recipe Types Get All (v2) ---

interface FatSecretRecipeTypesData {
    recipes?: {
        recipe_type: string[]
    };
    recipe_types?: { 
        recipe_type: string[] 
    }; // Nested array
}

export interface ApiFatSecretRecipeTypesResponse {
    success: boolean;
    data?: FatSecretRecipeTypesData;
    message?: string;
}

// --- Service Functions ---

// Define the backend API base URL
const API_BASE_URL = 'https://enmanueldel-vitality-vi-71.deno.dev/api';

// Existing functions (getRecipeCalorieEstimate, getRecipesByCategory, etc.) remain here
// ...

// --- NEW FatSecret Service Functions ---

export interface FatSecretSearchParams {
    search_expression?: string;
    recipe_types?: string; // Comma-separated
    // Add other optional filters from docs as needed (calories, macros, time, etc.)
    page_number?: number; // Zero-based
    max_results?: number; // Default 20, max 50
}

export async function searchRecipesFromFatSecret(
    params: FatSecretSearchParams
): Promise<ApiFatSecretSearchResponse> {
    const url = new URL('/fatsecret/recipes/search', API_BASE_URL);
    // Add params to URL search query
    if (params.search_expression) url.searchParams.append('search_expression', params.search_expression);
    if (params.recipe_types) url.searchParams.append('recipe_types', params.recipe_types);
    if (params.page_number !== undefined) url.searchParams.append('page_number', params.page_number.toString());
    if (params.max_results !== undefined) url.searchParams.append('max_results', params.max_results.toString());
    // Add other filters here...

    console.log(`RecipeApi: Searching FatSecret recipes from ${url.toString()}`);
    try {
        const response = await fetch(url.toString());
        const responseData: ApiFatSecretSearchResponse = await response.json();
        if (!response.ok) { throw new Error(responseData.message || `HTTP error! status: ${response.status}`); }
        // FatSecret might not have a top-level 'success' flag in its direct response,
        // Assuming backend proxy adds { success: true, data: fatSecretResponse } or { success: false, message: ... }
        if (!responseData.success) { throw new Error(responseData.message || `API error searching FatSecret recipes`); }
        return responseData;
    } catch (error) {
        console.error(`Error searching FatSecret recipes:`, error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error." };
    }
}

export async function getFatSecretRecipeDetailsById(recipeId: string): Promise<ApiFatSecretGetRecipeResponse> {
    const url = `${API_BASE_URL}/fatsecret/recipes/${recipeId}`;
    console.log(`RecipeApi: Fetching FatSecret recipe details for ID "${recipeId}" from ${url}`);
    try {
        const response = await fetch(url);
        const responseData: ApiFatSecretGetRecipeResponse = await response.json();
        if (!response.ok) { throw new Error(responseData.message || `HTTP error! status: ${response.status}`); }
        // Assuming backend proxy adds success flag
        if (!responseData.success || !responseData.data?.recipe) { throw new Error(responseData.message || `API error fetching FatSecret details for ${recipeId}`); }
        return responseData;
    } catch (error) {
        console.error(`Error fetching FatSecret recipe details for ${recipeId}:`, error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error." };
    }
}

export async function getFatSecretRecipeTypes(): Promise<ApiFatSecretRecipeTypesResponse> {
    const url = `${API_BASE_URL}/fatsecret/recipes/types`;
    console.log(`RecipeApi: Fetching FatSecret recipe types from ${url}`);
    try {
        const response = await fetch(url);
        const responseData: ApiFatSecretRecipeTypesResponse = await response.json();
        if (!response.ok) { throw new Error(responseData.message || `HTTP error! status: ${response.status}`); }
        // Assuming backend proxy adds success flag
        if (!responseData.success) { 
            throw new Error(responseData.message || `API error fetching FatSecret recipe types`); 
        }
        // Check if data exists in either format
        if (!responseData.data?.recipe_types && !responseData.data?.recipes) {
            throw new Error("No recipe types data found in the response");
        }
        return responseData;
    } catch (error) {
        console.error("Error fetching FatSecret recipe types:", error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error." };
    }
}
