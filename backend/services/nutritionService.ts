import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

// Load environment variables once at the start
const env = await load();
const FATSECRET_CLIENT_ID = Deno.env.get("FATSECRET_CLIENT_ID") || env["FATSECRET_CLIENT_ID"];
const FATSECRET_CLIENT_SECRET = Deno.env.get("FATSECRET_CLIENT_SECRET") || env["FATSECRET_CLIENT_SECRET"];

// Check if credentials are available
if (!FATSECRET_CLIENT_ID || !FATSECRET_CLIENT_SECRET) {
    console.error("Error: Missing FatSecret API credentials in environment variables");
}

// Token cache with expiration management
interface TokenCache {
    token: string;
    expiresAt: number; // Unix timestamp
}

let tokenCache: TokenCache | null = null;

/**
 * FatSecret API Interfaces
 */
export interface FatSecretFood {
    food_id: string;
    food_name: string;
    food_type: string; // "Generic" or "Brand"
    brand_name?: string;
    food_url: string;
    food_description: string;
}

interface FatSecretFoodsSearchResponse {
    foods: {
        food: FatSecretFood[];
    } | null;
}

/**
 * Standardized nutrition data interface for application use
 */
export interface NutritionData {
    id: string;
    name: string;
    isGeneric: boolean;
    brandName?: string;
    calories: number;
    calorieUnit: string; // "kcal"
    servingSize: string; // "100g", "1 cup", etc.
    protein: number;
    proteinUnit: string; // "g"
    carbs: number;
    carbsUnit: string; // "g"
    fat: number;
    fatUnit: string; // "g"
    // Optional additional nutritional info
    fiber?: number;
    sugar?: number;
    sodium?: number;
    // Source tracking
    source: string; // "FatSecret"
    sourceUrl?: string;
}

/**
 * Get a valid authentication token for FatSecret API
 * Handles caching and automatic renewal
 */
async function getFatSecretToken(): Promise<string> {
    // Check if we have a valid cached token
    const now = Date.now();
    if (tokenCache && tokenCache.expiresAt > now + 60000) { // 1 minute buffer
        return tokenCache.token;
    }

    // Need to get a new token
    const tokenUrl = "https://oauth.fatsecret.com/connect/token";
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", FATSECRET_CLIENT_ID!);
    params.append("client_secret", FATSECRET_CLIENT_SECRET!);

    try {
        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
        });

        if (!response.ok) {
            throw new Error(`FatSecret token API error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        
        // Cache the token with expiration (default is 86400 seconds / 24 hours)
        const expiresIn = data.expires_in || 86400;
        tokenCache = {
            token: data.access_token,
            expiresAt: now + (expiresIn * 1000) - 300000, // 5 minutes safety margin
        };
        
        return tokenCache.token;
    } catch (error) {
        console.error("Failed to obtain FatSecret token:", error);
        throw new Error("Failed to authenticate with nutrition API");
    }
}

/**
 * Parse nutrition values from food description
 */
function parseNutritionValues(description: string): { 
    calories: number; 
    servingSize: string;
    protein: number;
    carbs: number;
    fat: number;
} | null {
    // Example: "Per 100g - Calories: 52kcal | Fat: 0.17g | Carbs: 13.81g | Protein: 0.26g"
    const nutrientRegex = /Per\s+(.*?)\s+-\s+Calories:\s+(\d+)kcal\s+\|\s+Fat:\s+([\d.]+)g\s+\|\s+Carbs:\s+([\d.]+)g\s+\|\s+Protein:\s+([\d.]+)g/i;
    const match = description.match(nutrientRegex);

    if (match && match.length >= 6) {
        return {
            servingSize: match[1],
            calories: parseInt(match[2], 10),
            fat: parseFloat(match[3]),
            carbs: parseFloat(match[4]),
            protein: parseFloat(match[5])
        };
    }
    
    return null;
}

/**
 * Search for food nutrition data using FatSecret API
 * @param ingredient Food or ingredient name to search for
 * @param maxResults Maximum number of results to return
 * @param genericOnly If true, only return generic (non-brand) results
 * @returns Array of standardized nutrition data objects
 */
export async function searchFoodNutrition(
    ingredient: string, 
    maxResults: number = 5, 
    genericOnly: boolean = false
): Promise<NutritionData[]> {
    try {
        const token = await getFatSecretToken();
        
        // Build search URL
        const searchUrl = new URL("https://platform.fatsecret.com/rest/server.api");
        searchUrl.searchParams.append("method", "foods.search");
        searchUrl.searchParams.append("search_expression", ingredient);
        searchUrl.searchParams.append("format", "json");
        searchUrl.searchParams.append("max_results", maxResults.toString());
        
        // Make API request
        const response = await fetch(searchUrl.toString(), {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
        });

        if (!response.ok) {
            throw new Error(`FatSecret API error: ${response.status} ${await response.text()}`);
        }

        const responseText = await response.text();
        const data: FatSecretFoodsSearchResponse = JSON.parse(responseText);
        
        // Handle no results
        if (!data.foods || !data.foods.food || data.foods.food.length === 0) {
            return [];
        }
        
        // Process and filter results
        let foods = data.foods.food;
        
        // Filter to generic-only if requested
        if (genericOnly) {
            foods = foods.filter(food => food.food_type === "Generic");
        } else {
            // Otherwise sort to prioritize generic results
            foods = [...foods].sort((a, b) => {
                if (a.food_type === "Generic" && b.food_type !== "Generic") return -1;
                if (a.food_type !== "Generic" && b.food_type === "Generic") return 1;
                return 0;
            });
        }
        
        // Limit results after sorting
        foods = foods.slice(0, maxResults);
        
        // Convert to standardized format
        return foods.map(food => {
            const nutrition = parseNutritionValues(food.food_description);
            
            // Default values if parsing fails
            const defaults = {
                calories: 0,
                servingSize: "unknown",
                protein: 0,
                carbs: 0,
                fat: 0
            };
            
            const values = nutrition || defaults;
            
            return {
                id: food.food_id,
                name: food.food_name,
                isGeneric: food.food_type === "Generic",
                brandName: food.brand_name,
                calories: values.calories,
                calorieUnit: "kcal",
                servingSize: values.servingSize,
                protein: values.protein,
                proteinUnit: "g",
                carbs: values.carbs,
                carbsUnit: "g",
                fat: values.fat,
                fatUnit: "g",
                source: "FatSecret",
                sourceUrl: food.food_url
            };
        });
    } catch (error) {
        console.error(`Error searching for "${ingredient}":`, error);
        throw error;
    }
}

/**
 * Get detailed nutrition data for a specific food by ID
 */
export async function getFoodNutritionById(foodId: string): Promise<NutritionData | null> {
    try {
        const token = await getFatSecretToken();
        
        // Build the request URL
        const apiUrl = new URL("https://platform.fatsecret.com/rest/server.api");
        apiUrl.searchParams.append("method", "food.get.v2");
        apiUrl.searchParams.append("food_id", foodId);
        apiUrl.searchParams.append("format", "json");
        
        // Make API request
        const response = await fetch(apiUrl.toString(), {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
        });

        if (!response.ok) {
            throw new Error(`FatSecret API error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        
        // Handle no data
        if (!data.food) {
            return null;
        }
        
        const food = data.food;
        
        // Get the nutrition from the food description (if present)
        let nutrition = undefined;
        if (food.food_description && typeof food.food_description === "string") {
            nutrition = parseNutritionValues(food.food_description);
        }

        // If parsing from description failed or description absent, try to derive from the first serving entry
        if (!nutrition && food.servings && food.servings.serving) {
            const firstServing = Array.isArray(food.servings.serving) ? food.servings.serving[0] : food.servings.serving;
            if (firstServing && firstServing.calories !== undefined) {
                nutrition = {
                    calories: parseFloat(firstServing.calories) || 0,
                    servingSize: firstServing.serving_description || "per serving",
                    protein: parseFloat(firstServing.protein) || 0,
                    carbs: parseFloat(firstServing.carbohydrate) || 0,
                    fat: parseFloat(firstServing.fat) || 0,
                };
            }
        }

        if (!nutrition) {
            console.warn(`Could not extract nutrition values for food ID ${foodId}`);
            return null;
        }
        
        return {
            id: food.food_id,
            name: food.food_name,
            isGeneric: food.food_type === "Generic",
            brandName: food.brand_name,
            calories: nutrition.calories,
            calorieUnit: "kcal",
            servingSize: nutrition.servingSize,
            protein: nutrition.protein,
            proteinUnit: "g",
            carbs: nutrition.carbs,
            carbsUnit: "g",
            fat: nutrition.fat,
            fatUnit: "g",
            source: "FatSecret",
            sourceUrl: food.food_url
        };
    } catch (error) {
        console.error(`Error getting food nutrition by ID ${foodId}:`, error);
        return null;
    }
}

/**
 * Calculate nutrition values for a recipe based on ingredients
 * @param ingredients Array of ingredients with amounts
 * @returns Aggregated nutrition data
 */
export async function calculateRecipeNutrition(
    ingredients: Array<{ name: string; amount: number; unit: string }>
): Promise<NutritionData | null> {
    try {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        
        for (const ingredient of ingredients) {
            // Search for each ingredient
            const results = await searchFoodNutrition(ingredient.name, 1, true);
            
            if (results.length === 0) {
                console.warn(`No nutrition data found for: ${ingredient.name}`);
                continue;
            }
            
            // Get first result (most relevant)
            const nutrition = results[0];
            
            // TODO: Proper unit conversion based on serving size
            // This is a simplified version that assumes everything is in grams
            const conversionFactor = ingredient.amount / 100; // Assuming nutrition data is per 100g
            
            totalCalories += nutrition.calories * conversionFactor;
            totalProtein += nutrition.protein * conversionFactor;
            totalCarbs += nutrition.carbs * conversionFactor;
            totalFat += nutrition.fat * conversionFactor;
        }
        
        // Return aggregated nutrition data
        return {
            id: "recipe",
            name: "Recipe",
            isGeneric: true,
            calories: Math.round(totalCalories),
            calorieUnit: "kcal",
            servingSize: "entire recipe",
            protein: parseFloat(totalProtein.toFixed(2)),
            proteinUnit: "g",
            carbs: parseFloat(totalCarbs.toFixed(2)),
            carbsUnit: "g",
            fat: parseFloat(totalFat.toFixed(2)),
            fatUnit: "g",
            source: "Calculated"
        };
    } catch (error) {
        console.error("Error calculating recipe nutrition:", error);
        return null;
    }
}

// --- FatSecret Recipe API Functions ---

// Interface for search parameters, similar to frontend but for backend use
// We might not need all frontend params directly, or might transform them.
export interface FatSecretRecipeAPISearchParams {
    search_expression?: string;
    recipe_types?: string; // Comma-separated string of recipe type names
    // Add other relevant parameters from FatSecret docs: must_have_images, calories, etc.
    page_number?: string; // FatSecret expects string for page_number and max_results in params
    max_results?: string;
    // sort_by?: string;
}

/**
 * Search for recipes using FatSecret API (recipes.search.v3)
 */
export async function searchFatSecretRecipesPlatform(
    params: FatSecretRecipeAPISearchParams
): Promise<any> { // Return type will be the direct JSON from FatSecret
    try {
        const token = await getFatSecretToken();
        const apiUrl = new URL("https://platform.fatsecret.com/rest/recipes/search/v3");

        // Append common parameters
        apiUrl.searchParams.append("format", "json");

        // Append search-specific parameters from the input
        if (params.search_expression) apiUrl.searchParams.append("search_expression", params.search_expression);
        if (params.recipe_types) apiUrl.searchParams.append("recipe_types", params.recipe_types);
        if (params.page_number !== undefined) apiUrl.searchParams.append("page_number", params.page_number);
        if (params.max_results !== undefined) apiUrl.searchParams.append("max_results", params.max_results);
        // Add other supported params like must_have_images, calories filters, etc. here

        const response = await fetch(apiUrl.toString(), {
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`FatSecret Recipe Search API error: ${response.status}`, errorBody);
            throw new Error(`FatSecret Recipe Search API error: ${response.status} ${errorBody}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error in searchFatSecretRecipesPlatform:", error);
        throw error; // Re-throw to be handled by controller
    }
}

/**
 * Get detailed information for a specific recipe using FatSecret API (recipe.get.v2)
 */
export async function getFatSecretRecipeByIdPlatform(recipeId: string): Promise<any> {
    try {
        const token = await getFatSecretToken();
        const apiUrl = new URL("https://platform.fatsecret.com/rest/recipe/v2");
        
        apiUrl.searchParams.append("recipe_id", recipeId);
        apiUrl.searchParams.append("format", "json");

        const response = await fetch(apiUrl.toString(), {
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`FatSecret Get Recipe API error: ${response.status}`, errorBody);
            throw new Error(`FatSecret Get Recipe API error: ${response.status} ${errorBody}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error in getFatSecretRecipeByIdPlatform for ID ${recipeId}:`, error);
        throw error;
    }
}

/**
 * Get all supported recipe type names using FatSecret API (recipe_types.get.v2)
 */
export async function getFatSecretRecipeTypesPlatform(): Promise<any> {
    try {
        const token = await getFatSecretToken();
        // The documentation URL is https://platform.fatsecret.com/rest/recipe-types/v2
        // It also mentions method: recipe_types.get.v2. Let's use the direct URL.
        const apiUrl = new URL("https://platform.fatsecret.com/rest/recipe-types/v2");
        apiUrl.searchParams.append("format", "json");

        const response = await fetch(apiUrl.toString(), {
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`FatSecret Recipe Types API error: ${response.status}`, errorBody);
            throw new Error(`FatSecret Recipe Types API error: ${response.status} ${errorBody}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error in getFatSecretRecipeTypesPlatform:", error);
        throw error;
    }
}

// Export a test function to check API connectivity
export async function testApiConnection(): Promise<boolean> {
    try {
        const token = await getFatSecretToken();
        return !!token;
    } catch (error) {
        console.error("API connection test failed:", error);
        return false;
    }
}
