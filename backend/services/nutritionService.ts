import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { dirname, fromFileUrl, join, normalize } from "https://deno.land/std@0.208.0/path/mod.ts";

type EnvMap = Record<string, string>;

const serviceDir = dirname(fromFileUrl(import.meta.url));
const backendDir = dirname(serviceDir);
const projectRootDir = dirname(backendDir);

const uniquePaths = (paths: string[]): string[] => {
    const seen = new Set<string>();
    return paths
        .map((path) => normalize(path))
        .filter((path) => {
            if (seen.has(path)) return false;
            seen.add(path);
            return true;
        });
};

const loadFatSecretEnv = async (): Promise<EnvMap> => {
    const loadedEnv: EnvMap = {};
    const envPaths = uniquePaths([
        join(Deno.cwd(), ".env"),
        join(Deno.cwd(), ".env.local"),
        join(backendDir, ".env"),
        join(backendDir, ".env.local"),
        join(projectRootDir, ".env"),
        join(projectRootDir, ".env.local"),
    ]);

    for (const envPath of envPaths) {
        try {
            Object.assign(loadedEnv, await load({ envPath, export: false, examplePath: null }));
        } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) {
                console.warn(`Unable to load env file at ${envPath}:`, error);
            }
        }
    }

    return loadedEnv;
};

// Load environment variables once at the start. Deno.env wins over dotenv files.
const env = await loadFatSecretEnv();
const getEnvValue = (key: string): string | undefined => {
    const runtimeValue = Deno.env.get(key)?.trim();
    if (runtimeValue) return runtimeValue;

    const fileValue = env[key]?.trim();
    return fileValue || undefined;
};

const FATSECRET_CLIENT_ID = getEnvValue("FATSECRET_CLIENT_ID");
const FATSECRET_CLIENT_SECRET = getEnvValue("FATSECRET_CLIENT_SECRET");

// Check if credentials are available
if (!FATSECRET_CLIENT_ID || !FATSECRET_CLIENT_SECRET) {
    console.error("Error: Missing FatSecret API credentials in environment variables");
    const unsupportedKeys = ["FAST_SECRET_CLIENT_ID", "FAST_SECRET_API"].filter((key) => getEnvValue(key));
    if (unsupportedKeys.length > 0) {
        console.error(
            `Ignoring unsupported FatSecret env key(s): ${unsupportedKeys.join(", ")}. ` +
                "Use FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET.",
        );
    }
}

// Token cache with expiration management
interface TokenCache {
    token: string;
    expiresAt: number; // Unix timestamp
}

const tokenCacheByScope = new Map<string, TokenCache>();

export class FatSecretApiError extends Error {
    status: number;
    code?: string;
    isMissingScope: boolean;
    isInvalidClient: boolean;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = "FatSecretApiError";
        this.status = status;
        this.code = code;
        this.isMissingScope = /missing scope|invalid_scope|not enabled|not available|premier|add-?on/i.test(message);
        this.isInvalidClient = /invalid_client|invalid client|client credentials/i.test(message);
    }
}

/**
 * FatSecret API Interfaces
 */
export interface FatSecretFood {
    food_id: string;
    food_name: string;
    food_type: string; // "Generic" or "Brand"
    brand_name?: string;
    food_url: string;
    food_description?: string;
    food_sub_categories?: { food_sub_category: string[] | string };
    food_images?: { food_image: FatSecretFoodImage[] | FatSecretFoodImage };
    food_attributes?: unknown;
    servings?: { // Add servings to the FatSecretFood interface
        serving: FatSecretServing[] | FatSecretServing; // Can be an array or single object
    };
}

interface FatSecretFoodsSearchResponse {
    foods_search: { // Changed from 'foods'
        results: {     // Added 'results'
            food: FatSecretFood[];
        } | null;
        // other potential fields like max_results, total_results, page_number
    } | null;
}

interface FatSecretFoodImage {
    image_url: string;
    image_type?: string;
}

// Define a type for individual serving from FatSecret API
interface FatSecretServing {
    serving_id: string;
    serving_description: string;
    calories: string; // These are often strings in the API response
    protein: string;
    fat: string;
    carbohydrate: string;
    fiber?: string;
    sugar?: string;
    sodium?: string;
    is_default?: string; // Can be "1" or undefined
    metric_serving_amount?: string;
    metric_serving_unit?: string;
    // Potentially other fields like metric_serving_amount, metric_serving_unit
}

/**
 * Standardized nutrition data interface for application use
 */
export interface NutritionData {
    id: string; // FatSecret's food_id
    name: string;
    isGeneric: boolean;
    brandName?: string;
    servingId: string; // FatSecret's serving_id for the chosen reference serving
    servingSize: string; // e.g., "100g", "1 cup", "1 medium apple"
    calories: number; // for the servingSize above
    calorieUnit: string; // "kcal"
    protein: number; // for the servingSize above
    proteinUnit: string; // "g"
    carbs: number; // for the servingSize above
    carbsUnit: string; // "g"
    fat: number; // for the servingSize above
    fatUnit: string; // "g"
    // Optional additional nutritional info
    fiber?: number;
    sugar?: number;
    sodium?: number;
    // Source tracking
    source: string; // "FatSecret"
    sourceUrl?: string;
    imageUrl?: string;
    foodImages?: FatSecretFoodImage[];
    foodAttributes?: unknown;
    foodSubCategories?: string[];
    availableServings?: NutritionServing[];
}

export interface NutritionServing {
    servingId: string;
    servingSize: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    metricServingAmount?: number;
    metricServingUnit?: string;
}

type FatSecretQueryParams = Record<string, string | number | boolean | undefined | null>;
type FatSecretPayload = Record<string, unknown>;

export interface FatSecretFoodSearchV5Params extends FatSecretQueryParams {
    search_expression?: string;
    page_number?: string | number;
    max_results?: string | number;
    include_sub_categories?: string | boolean;
    include_food_images?: string | boolean;
    include_food_attributes?: string | boolean;
    flag_default_serving?: string | boolean;
    food_type?: "none" | "generic" | "brand" | string;
    region?: string;
    language?: string;
}

export interface FatSecretFoodLookupParams extends FatSecretQueryParams {
    include_sub_categories?: string | boolean;
    include_food_images?: string | boolean;
    include_food_attributes?: string | boolean;
    flag_default_serving?: string | boolean;
    region?: string;
    language?: string;
}

export interface FatSecretTextAnalysisPayload extends FatSecretPayload {
    user_input: string;
    include_food_data?: boolean;
    eaten_foods?: unknown[];
    region?: string;
    language?: string;
}

export interface FatSecretImageRecognitionPayload extends FatSecretPayload {
    image_b64: string;
    include_food_data?: boolean;
    eaten_foods?: unknown[];
    region?: string;
    language?: string;
}

export interface FatSecretFeedbackPayload extends FatSecretPayload {
    barcode?: string;
    issue_type_id: number;
    issue_type?: string;
    notes?: string;
    external_id: string;
    returned_food?: {
        food_id?: number | string;
        serving_id?: number | string;
    };
    image_file_extension?: string;
    region?: string;
    language?: string;
}

/**
 * Get a valid authentication token for FatSecret API
 * Handles caching and automatic renewal
 */
async function getFatSecretToken(scope = ""): Promise<string> {
    if (!FATSECRET_CLIENT_ID || !FATSECRET_CLIENT_SECRET) {
        throw new FatSecretApiError(
            "FatSecret credentials are not configured. Set FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET.",
            500,
        );
    }

    // Check if we have a valid cached token
    const now = Date.now();
    const cacheKey = scope.trim();
    const cachedToken = tokenCacheByScope.get(cacheKey);
    if (cachedToken && cachedToken.expiresAt > now + 60000) { // 1 minute buffer
        return cachedToken.token;
    }

    // Need to get a new token
    const tokenUrl = "https://oauth.fatsecret.com/connect/token";
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    if (cacheKey) {
        params.append("scope", cacheKey);
    }

    try {
        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${btoa(`${FATSECRET_CLIENT_ID}:${FATSECRET_CLIENT_SECRET}`)}`,
            },
            body: params,
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = errorText || response.statusText;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData?.error_description || errorData?.error?.message || errorData?.message || errorMessage;
            } catch (_error) {
                // Keep raw text when the response is not JSON.
            }
            throw new FatSecretApiError(`FatSecret token API error: ${errorMessage}`, response.status);
        }

        const data = await response.json();

        // Cache the token with expiration (default is 86400 seconds / 24 hours)
        const expiresIn = data.expires_in || 86400;
        tokenCacheByScope.set(cacheKey, {
            token: data.access_token,
            expiresAt: now + (expiresIn * 1000) - 300000, // 5 minutes safety margin
        });

        return tokenCacheByScope.get(cacheKey)!.token;
    } catch (error) {
        console.error("Failed to obtain FatSecret token:", error);
        if (error instanceof FatSecretApiError) {
            throw error;
        }
        throw new Error("Failed to authenticate with nutrition API");
    }
}

function appendDefinedParams(url: URL, params: FatSecretQueryParams = {}) {
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.set(key, String(value));
    }
}

async function fatSecretApiRequest(
    path: string,
    options: {
        method?: "GET" | "POST";
        query?: FatSecretQueryParams;
        body?: FatSecretPayload;
        scope?: string;
    } = {},
): Promise<any> {
    const token = await getFatSecretToken(options.scope);
    const method = options.method ?? "GET";
    const normalizedPath = path.replace(/^\/+/, "");
    const apiUrl = new URL(`https://platform.fatsecret.com/rest/${normalizedPath}`);

    if (method === "GET") {
        appendDefinedParams(apiUrl, { format: "json", ...options.query });
    } else {
        appendDefinedParams(apiUrl, options.query);
    }

    const response = await fetch(apiUrl.toString(), {
        method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
        },
        body: method === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
    });

    const responseText = await response.text();
    let data: any = null;
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch (_error) {
        data = { raw: responseText };
    }

    if (!response.ok) {
        const message = data?.error?.message || data?.message || responseText || response.statusText;
        const code = data?.error?.code ? String(data.error.code) : undefined;
        throw new FatSecretApiError(`FatSecret API error: ${response.status} ${message}`, response.status, code);
    }

    return data;
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
}

function getFoodServings(food: any): FatSecretServing[] {
    return asArray<FatSecretServing>(food?.servings?.serving ?? food?.serving);
}

function pickReferenceServing(servingsArray: FatSecretServing[]): FatSecretServing | undefined {
    return servingsArray.find((s) => String(s.is_default) === "1")
        ?? servingsArray.find((s) => s.serving_description?.toLowerCase().includes("100g") || s.serving_description?.toLowerCase().includes("100 g"))
        ?? servingsArray[0];
}

function getFoodImages(food: any): FatSecretFoodImage[] {
    return asArray<FatSecretFoodImage>(food?.food_images?.food_image);
}

function getFoodSubCategories(food: any): string[] {
    return asArray<string>(food?.food_sub_categories?.food_sub_category);
}

function servingToNutritionServing(serving: FatSecretServing): NutritionServing {
    return {
        servingId: String(serving.serving_id ?? "0"),
        servingSize: serving.serving_description ?? "serving",
        calories: parseFloat(serving.calories) || 0,
        protein: parseFloat(serving.protein) || 0,
        carbs: parseFloat(serving.carbohydrate) || 0,
        fat: parseFloat(serving.fat) || 0,
        metricServingAmount: serving.metric_serving_amount ? parseFloat(serving.metric_serving_amount) : undefined,
        metricServingUnit: serving.metric_serving_unit,
    };
}

export function normalizeFatSecretFood(foodFromApi: any): NutritionData | null {
    if (!foodFromApi?.food_id || !foodFromApi?.food_name) return null;

    const servingsArray = getFoodServings(foodFromApi);
    let referenceServing = pickReferenceServing(servingsArray);
    let selectedServingData: NutritionServing | null = referenceServing
        ? servingToNutritionServing(referenceServing)
        : null;

    if (!selectedServingData && foodFromApi.food_description && typeof foodFromApi.food_description === "string") {
        const parsedFromDescription = parseNutritionValues(foodFromApi.food_description);
        if (parsedFromDescription) {
            selectedServingData = {
                servingId: "unknown_from_description",
                servingSize: parsedFromDescription.servingSize,
                calories: parsedFromDescription.calories,
                protein: parsedFromDescription.protein,
                carbs: parsedFromDescription.carbs,
                fat: parsedFromDescription.fat,
            };
        }
    }

    if (!selectedServingData) return null;

    const foodImages = getFoodImages(foodFromApi);
    const foodSubCategories = getFoodSubCategories(foodFromApi);

    return {
        id: String(foodFromApi.food_id),
        name: foodFromApi.food_name,
        isGeneric: foodFromApi.food_type === "Generic",
        brandName: foodFromApi.brand_name,
        servingId: selectedServingData.servingId,
        servingSize: selectedServingData.servingSize,
        calories: selectedServingData.calories,
        calorieUnit: "kcal",
        protein: selectedServingData.protein,
        proteinUnit: "g",
        carbs: selectedServingData.carbs,
        carbsUnit: "g",
        fat: selectedServingData.fat,
        fatUnit: "g",
        fiber: referenceServing?.fiber ? parseFloat(referenceServing.fiber) : undefined,
        sugar: referenceServing?.sugar ? parseFloat(referenceServing.sugar) : undefined,
        sodium: referenceServing?.sodium ? parseFloat(referenceServing.sodium) : undefined,
        source: "FatSecret",
        sourceUrl: foodFromApi.food_url,
        imageUrl: foodImages[0]?.image_url,
        foodImages,
        foodAttributes: foodFromApi.food_attributes,
        foodSubCategories,
        availableServings: servingsArray.map(servingToNutritionServing),
    };
}

function normalizeFatSecretFoodResponseItem(item: any): NutritionData | null {
    const eatenNutrition = item?.eaten?.total_nutritional_content;
    if (!item?.food_id || !item?.food_entry_name || !eatenNutrition) return null;

    const food = item.food ?? {};
    const suggestedServing = item.suggested_serving ?? {};
    const servingId = String(suggestedServing.serving_id ?? `recognized_${item.food_id}`);
    const servingSize = suggestedServing.serving_description
        ?? (item.eaten?.total_metric_amount && item.eaten?.metric_description
            ? `${item.eaten.total_metric_amount} ${item.eaten.metric_description}`
            : "recognized serving");

    const serving: NutritionServing = {
        servingId,
        servingSize,
        calories: parseFloat(eatenNutrition.calories) || 0,
        protein: parseFloat(eatenNutrition.protein) || 0,
        carbs: parseFloat(eatenNutrition.carbohydrate) || 0,
        fat: parseFloat(eatenNutrition.fat) || 0,
        metricServingAmount: suggestedServing.metric_measure_amount
            ? parseFloat(String(suggestedServing.metric_measure_amount))
            : item.eaten?.total_metric_amount
                ? parseFloat(String(item.eaten.total_metric_amount))
                : undefined,
        metricServingUnit: suggestedServing.metric_serving_description ?? item.eaten?.metric_description,
    };

    const foodImages = getFoodImages(food);
    return {
        id: String(item.food_id),
        name: item.food_entry_name,
        isGeneric: food.food_type ? food.food_type === "Generic" : true,
        brandName: food.brand_name,
        servingId,
        servingSize,
        calories: serving.calories,
        calorieUnit: "kcal",
        protein: serving.protein,
        proteinUnit: "g",
        carbs: serving.carbs,
        carbsUnit: "g",
        fat: serving.fat,
        fatUnit: "g",
        fiber: eatenNutrition.fiber ? parseFloat(eatenNutrition.fiber) : undefined,
        sugar: eatenNutrition.sugar ? parseFloat(eatenNutrition.sugar) : undefined,
        sodium: eatenNutrition.sodium ? parseFloat(eatenNutrition.sodium) : undefined,
        source: "FatSecret",
        sourceUrl: food.food_url,
        imageUrl: foodImages[0]?.image_url,
        foodImages,
        foodAttributes: food.food_attributes,
        foodSubCategories: getFoodSubCategories(food),
        availableServings: [serving],
    };
}

export function normalizeFatSecretFoodsFromResponse(responseData: any): NutritionData[] {
    const normalizedFoods: NutritionData[] = [];
    const seen = new Set<string>();

    const visit = (value: unknown) => {
        if (!value) return;
        if (Array.isArray(value)) {
            value.forEach(visit);
            return;
        }
        if (typeof value !== "object") return;

        const candidate = value as Record<string, unknown>;
        const recognizedFood = normalizeFatSecretFoodResponseItem(candidate);
        if (recognizedFood) {
            const key = `${recognizedFood.id}:${recognizedFood.servingId}`;
            if (!seen.has(key)) {
                seen.add(key);
                normalizedFoods.push(recognizedFood);
            }
            return;
        }

        if (candidate.food_id && candidate.food_name) {
            const normalized = normalizeFatSecretFood(candidate);
            if (normalized) {
                const key = `${normalized.id}:${normalized.servingId}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    normalizedFoods.push(normalized);
                }
            }
        }

        Object.values(candidate).forEach(visit);
    };

    visit(responseData);
    return normalizedFoods;
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
        const data: FatSecretFoodsSearchResponse = await searchFatSecretFoodsV5({
            search_expression: ingredient,
            max_results: maxResults,
            flag_default_serving: true,
        });

        // Handle no results or incorrect structure
        if (!data.foods_search || !data.foods_search.results || !data.foods_search.results.food) {
            return [];
        }

        // Process and filter results
        let foodsFromApi = data.foods_search.results.food;

        // Filter to generic-only if requested
        if (genericOnly) {
            foodsFromApi = foodsFromApi.filter(food => food.food_type === "Generic");
        } else {
            // Otherwise sort to prioritize generic results
            foodsFromApi = [...foodsFromApi].sort((a, b) => {
                if (a.food_type === "Generic" && b.food_type !== "Generic") return -1;
                if (a.food_type !== "Generic" && b.food_type === "Generic") return 1;
                return 0;
            });
        }

        // Limit results after sorting/filtering
        foodsFromApi = foodsFromApi.slice(0, maxResults);

        // Convert to standardized format
        const processedFoods = foodsFromApi
            .map(normalizeFatSecretFood)
            .filter((food): food is NutritionData => Boolean(food));
        // console.log("Processed Nutrition Data:", JSON.stringify(processedFoods, null, 2)); // For debugging processed data
        return processedFoods;

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
        const data = await getFatSecretFoodByIdV5(foodId, {
            flag_default_serving: true,
            include_sub_categories: true,
            include_food_images: true,
            include_food_attributes: true,
        });

        // Handle no data or incorrect structure
        if (!data.food) {
            console.warn(`No food data returned for food ID ${foodId}`);
            return null;
        }

        const normalizedFood = normalizeFatSecretFood(data.food);
        if (!normalizedFood) {
            console.warn(`Could not extract serving nutrition data for food ID ${foodId}`);
        }
        return normalizedFood;
    } catch (error) {
        console.error(`Error getting food nutrition by ID ${foodId}:`, error);
        return null;
    }
}

export async function searchFatSecretFoodsV5(params: FatSecretFoodSearchV5Params): Promise<any> {
    return await fatSecretApiRequest("foods/search/v5", {
        query: {
            flag_default_serving: true,
            ...params,
            format: "json",
        },
    });
}

export async function getFatSecretFoodByIdV5(
    foodId: string,
    params: FatSecretFoodLookupParams = {},
): Promise<any> {
    return await fatSecretApiRequest("food/v5", {
        query: {
            food_id: foodId,
            flag_default_serving: true,
            ...params,
            format: "json",
        },
    });
}

export async function getFatSecretAutocomplete(
    expression: string,
    params: FatSecretQueryParams = {},
): Promise<any> {
    return await fatSecretApiRequest("food/autocomplete/v2", {
        query: {
            expression,
            max_results: 10,
            ...params,
            format: "json",
        },
    });
}

export async function findFatSecretFoodByBarcode(
    barcode: string,
    params: FatSecretFoodLookupParams = {},
): Promise<any> {
    return await fatSecretApiRequest("food/barcode/find-by-id/v2", {
        query: {
            barcode,
            flag_default_serving: true,
            include_sub_categories: true,
            include_food_images: true,
            include_food_attributes: true,
            ...params,
            format: "json",
        },
    });
}

export async function analyzeFatSecretNaturalLanguage(
    payload: FatSecretTextAnalysisPayload,
): Promise<any> {
    return await fatSecretApiRequest("natural-language-processing/v1", {
        method: "POST",
        scope: "nlp",
        body: {
            include_food_data: true,
            region: "US",
            language: "en",
            ...payload,
        },
    });
}

export async function recognizeFatSecretFoodImage(
    payload: FatSecretImageRecognitionPayload,
): Promise<any> {
    return await fatSecretApiRequest("image-recognition/v2", {
        method: "POST",
        scope: "image-recognition",
        body: {
            include_food_data: true,
            region: "US",
            language: "en",
            ...payload,
        },
    });
}

export async function submitFatSecretFoodFeedback(
    payload: FatSecretFeedbackPayload,
): Promise<any> {
    return await fatSecretApiRequest("feedback/v1", {
        method: "POST",
        body: {
            region: "US",
            language: "en",
            ...payload,
        },
    });
}

export async function getFatSecretFoodBrands(params: FatSecretQueryParams = {}): Promise<any> {
    return await fatSecretApiRequest("brands/v2", {
        query: {
            ...params,
            format: "json",
        },
    });
}

export async function getFatSecretFoodCategories(params: FatSecretQueryParams = {}): Promise<any> {
    return await fatSecretApiRequest("food-categories/v2", {
        query: {
            ...params,
            format: "json",
        },
    });
}

export async function getFatSecretFoodSubCategories(params: FatSecretQueryParams = {}): Promise<any> {
    return await fatSecretApiRequest("food-sub-categories/v2", {
        query: {
            ...params,
            format: "json",
        },
    });
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
            servingId: "aggregated_recipe_serving",
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
    [key: string]: string | undefined;
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
        return await fatSecretApiRequest("recipes/search/v3", {
            query: {
                ...params,
                format: "json",
            },
        });
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
        return await fatSecretApiRequest("recipe/v2", {
            query: {
                recipe_id: recipeId,
                format: "json",
            },
        });
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
        return await fatSecretApiRequest("recipe-types/v2", {
            query: { format: "json" },
        });
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
