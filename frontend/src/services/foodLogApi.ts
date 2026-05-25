// frontend/src/services/foodLogApi.ts
import { AuthContextType } from '../context/AuthContext'; // Adjust path if your AuthContextType is elsewhere

// --- Re-define or Import Shared Types ---

// NutritionData: Represents a food item returned by FatSecret search or get details
// This should align with what your backend /api/fatsecret/foods/... endpoints return.
export interface NutritionData {
  id: string; // FatSecret's food_id
  name: string;
  isGeneric: boolean;
  brandName?: string;
  servingId: string; // FatSecret's serving_id for the chosen reference serving
  servingSize: string; // e.g., "1 medium apple", "100g"
  calories: number;
  calorieUnit: string; // Should be "kcal"
  protein: number;
  proteinUnit: string; // Should be "g"
  carbs: number;
  carbsUnit: string; // Should be "g"
  fat: number;
  fatUnit: string; // Should be "g"
  fiber?: number;
  sugar?: number;
  sodium?: number;
  source: string; // e.g., "FatSecret"
  sourceUrl?: string;
  imageUrl?: string;
  foodImages?: { image_url: string; image_type?: string }[];
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

// AutocompleteSuggestion: Simplified structure for search suggestions
export interface AutocompleteSuggestion {
  id: string;
  name: string;
  brandName?: string;
  servingSize: string;
}

export interface FatSecretAnalysisResponse {
  raw: unknown;
  foods: NutritionData[];
}

export interface FatSecretFoodCategory {
  food_category_id: string;
  food_category_name: string;
  food_category_description?: string;
}

export interface FatSecretFeedbackPayload {
  barcode?: string;
  issue_type_id: number;
  issue_type?: string;
  notes?: string;
  external_id: string;
  returned_food?: {
    food_id?: string | number;
    serving_id?: string | number;
  };
  image_file_extension?: string;
}

// CreateFoodLogEntryPayload: Structure for POSTing a new food log entry
export interface CreateFoodLogEntryPayload {
  fatsecret_food_id: string;
  fatsecret_serving_id: string;
  reference_serving_description: string; // The NutritionData.servingSize
  base_calories: number; // Calories for 1 unit of the reference_serving_description
  base_protein: number;
  base_fat: number;
  base_carbs: number;
  food_name: string;
  logged_quantity: number; // User-entered multiplier
  meal_type: string; // 'breakfast', 'lunch', 'dinner', 'snack'
  log_date: string; // Format: "YYYY-MM-DD"
  notes?: string;
}

// FoodLogEntry: Structure for a food log entry retrieved from the backend
// This should match your backend's FoodLogEntrySchema.
export interface FoodLogEntry {
  log_entry_id: number;
  user_id: string;
  log_date: string; // Or Date, depends on how your backend serializes it
  meal_type: string;
  fatsecret_food_id: string;
  fatsecret_serving_id: string;
  logged_serving_description: string;
  logged_quantity: number; // May come as string from backend (e.g., "1.50")
  calories_consumed: number | string;
  protein_consumed: number | string;
  fat_consumed: number | string;
  carbs_consumed: number | string;
  food_name?: string | null;
  notes?: string | null;
  created_at: string; // Or Date
  updated_at: string; // Or Date
}

// API Base URL - Updated to be consistent with other API services
import { API_BASE_URL } from '../config';

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

      throw new Error("Token expired");
    }
  }

  return response;
};


// --- Food Search & Details (FatSecret Proxied) ---

export const searchFoodsAPI = async (
  query: string,
  auth: AuthContextType,
  maxResults = 10
): Promise<NutritionData[]> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = `${API_BASE_URL}/fatsecret/foods/search?query=${encodeURIComponent(query)}&max_results=${maxResults}`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to search foods.');
  return data.data;
};

export const getFoodDetailsAPI = async (
  foodId: string,
  auth: AuthContextType
): Promise<NutritionData | null> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = `${API_BASE_URL}/fatsecret/foods/${foodId}`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get food details.');
  return data.data;
};

export const searchFoodsAutocompleteAPI = async (
  expression: string,
  auth: AuthContextType
): Promise<AutocompleteSuggestion[]> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = `${API_BASE_URL}/fatsecret/foods/autocomplete?expression=${encodeURIComponent(expression)}`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get autocomplete suggestions.');
  return data.data;
};

export const searchFoodsV5API = async (
  query: string,
  auth: AuthContextType,
  maxResults = 10,
  options: Record<string, string | number | boolean | undefined> = {}
): Promise<FatSecretAnalysisResponse> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = new URL(`${API_BASE_URL}/fatsecret/foods/search-v5`);
  url.searchParams.set("search_expression", query);
  url.searchParams.set("max_results", String(maxResults));
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });

  const response = await fetchWithAuth(url.toString(), { method: 'GET' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to search foods.');
  return data.data;
};

export const findFoodByBarcodeAPI = async (
  barcode: string,
  auth: AuthContextType
): Promise<NutritionData> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = `${API_BASE_URL}/fatsecret/foods/barcode/${encodeURIComponent(barcode)}`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to find food by barcode.');
  return data.data.food;
};

export const analyzeMealTextAPI = async (
  userInput: string,
  auth: AuthContextType
): Promise<FatSecretAnalysisResponse> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = `${API_BASE_URL}/fatsecret/foods/nlp`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify({
      user_input: userInput,
      include_food_data: true,
      region: "US",
      language: "en",
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to analyze meal text.');
  return data.data;
};

export const recognizeFoodImageAPI = async (
  imageB64: string,
  auth: AuthContextType
): Promise<FatSecretAnalysisResponse> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = `${API_BASE_URL}/fatsecret/foods/image-recognition`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify({
      image_b64: imageB64,
      include_food_data: true,
      region: "US",
      language: "en",
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to recognize food image.');
  return data.data;
};

export const submitFoodFeedbackAPI = async (
  payload: FatSecretFeedbackPayload,
  auth: AuthContextType
): Promise<unknown> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = `${API_BASE_URL}/fatsecret/foods/feedback`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to submit food feedback.');
  return data.data;
};

export const getFoodBrandsAPI = async (
  auth: AuthContextType,
  startsWith = "",
  brandType = "manufacturer"
): Promise<string[]> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = new URL(`${API_BASE_URL}/fatsecret/foods/brands`);
  if (startsWith) url.searchParams.set("starts_with", startsWith);
  if (brandType) url.searchParams.set("brand_type", brandType);
  const response = await fetchWithAuth(url.toString(), { method: 'GET' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch food brands.');
  const brands = data.data?.food_brands?.food_brand;
  return Array.isArray(brands) ? brands : brands ? [brands] : [];
};

export const getFoodCategoriesAPI = async (
  auth: AuthContextType
): Promise<FatSecretFoodCategory[]> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = `${API_BASE_URL}/fatsecret/foods/categories`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch food categories.');
  const categories = data.data?.food_categories?.food_category;
  return Array.isArray(categories) ? categories : categories ? [categories] : [];
};

export const getFoodSubCategoriesAPI = async (
  foodCategoryId: string,
  auth: AuthContextType
): Promise<string[]> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = new URL(`${API_BASE_URL}/fatsecret/foods/sub-categories`);
  url.searchParams.set("food_category_id", foodCategoryId);
  const response = await fetchWithAuth(url.toString(), { method: 'GET' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch food subcategories.');
  const subCategories = data.data?.food_sub_categories?.food_sub_category;
  return Array.isArray(subCategories) ? subCategories : subCategories ? [subCategories] : [];
};


// --- Food Logging Operations ---

export const createFoodLogEntryAPI = async (
  payload: CreateFoodLogEntryPayload,
  auth: AuthContextType
): Promise<FoodLogEntry> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = `${API_BASE_URL}/food-logs`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create food log entry.');
  return data.data;
};

export const getFoodLogEntriesAPI = async (
  date: string, // YYYY-MM-DD
  auth: AuthContextType
): Promise<FoodLogEntry[]> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = `${API_BASE_URL}/food-logs?date=${date}`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch food log entries.');
  return data.data;
};

export const deleteFoodLogEntryAPI = async (
  logEntryId: number,
  auth: AuthContextType
): Promise<{ success: boolean, message: string }> => {
  if (!auth.token) throw new Error("Authentication token not found.");
  const url = `${API_BASE_URL}/food-logs/${logEntryId}`;
  const response = await fetchWithAuth(url, { method: 'DELETE' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete food log entry.');
  return data;
};
