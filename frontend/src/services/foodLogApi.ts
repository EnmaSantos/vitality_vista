// frontend/src/services/foodLogApi.ts
import { AuthContextType } from '../context/AuthContext.tsx'; // Adjust path if your AuthContextType is elsewhere

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
}

// AutocompleteSuggestion: Simplified structure for search suggestions
export interface AutocompleteSuggestion {
  id: string;
  name: string;
  brandName?: string;
  servingSize: string;
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
  calories_consumed: number;
  protein_consumed: number; // May come as string
  fat_consumed: number;     // May come as string
  carbs_consumed: number;   // May come as string
  notes?: string | null;
  created_at: string; // Or Date
  updated_at: string; // Or Date
}

// API Base URL - Make sure this is set in your frontend .env file (e.g., .env.local)
// Example: VITE_API_BASE_URL=http://localhost:8000/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * A helper function to make authenticated API calls.
 * It automatically includes the Authorization header if a token is present.
 * Parses JSON and throws a structured error on failure.
 * @param url The API endpoint URL.
 * @param options Standard RequestInit options.
 * @param auth AuthContextType object containing the token.
 * @returns Promise<any> The `data` field from the backend's response.
 */
async function fetchWithAuth(url: string, options: RequestInit = {}, auth: AuthContextType): Promise<any> {
  const headers = new Headers(options.headers || {});
  if (auth.token) {
    headers.append('Authorization', `Bearer ${auth.token}`);
  }
  // Content-Type is needed for POST/PUT, Accept for getting JSON back
  if (options.method === 'POST' || options.method === 'PUT') {
    headers.append('Content-Type', 'application/json');
  }
  headers.append('Accept', 'application/json');

  console.log(`WorkspaceWithAuth: Calling ${options.method || 'GET'} ${url}`); // Log the call

  const response = await fetch(url, { ...options, headers });
  let responseData;

  // Try to parse JSON, but handle cases where body might be empty (e.g., 204 No Content)
  try {
    responseData = await response.json();
  } catch (e) {
    if (response.ok && response.status !== 204) { // 204 No Content is a valid empty response
      console.error(`WorkspaceWithAuth: JSON parsing error for ${url}`, e);
      throw new Error(`Failed to parse JSON response from ${url}`);
    }
    // If not ok, or 204, responseData will be undefined, which is fine for error handling below
  }

  if (!response.ok) {
    const errorMessage = responseData?.message || `Request failed with status ${response.status}`;
    console.error(`WorkspaceWithAuth: API Error (${url}): ${response.status}`, responseData || await response.text());
    throw new Error(errorMessage);
  }

  // Assuming backend responses have a { success: boolean, data?: any, message?: string } structure
  if (responseData && responseData.success === false) {
      console.error(`WorkspaceWithAuth: API Error (success:false) (${url}):`, responseData);
      throw new Error(responseData.message || 'API operation failed');
  }
  
  return responseData?.data; // Return the 'data' field on success
}


// --- Food Search & Details (FatSecret Proxied) ---

export const searchFoodsAPI = async (
  query: string,
  auth: AuthContextType,
  maxResults = 10
): Promise<NutritionData[]> => {
  const url = `${API_BASE_URL}/fatsecret/foods/search?query=${encodeURIComponent(query)}&max_results=${maxResults}`;
  return fetchWithAuth(url, { method: 'GET' }, auth);
};

export const getFoodDetailsAPI = async (
  foodId: string,
  auth: AuthContextType
): Promise<NutritionData | null> => {
  const url = `${API_BASE_URL}/fatsecret/foods/${foodId}`;
  return fetchWithAuth(url, { method: 'GET' }, auth);
};

export const searchFoodsAutocompleteAPI = async (
  expression: string,
  auth: AuthContextType
): Promise<AutocompleteSuggestion[]> => {
  const url = `${API_BASE_URL}/fatsecret/foods/autocomplete?expression=${encodeURIComponent(expression)}`;
  return fetchWithAuth(url, { method: 'GET' }, auth);
};


// --- Food Logging Operations ---

export const createFoodLogEntryAPI = async (
  payload: CreateFoodLogEntryPayload,
  auth: AuthContextType
): Promise<FoodLogEntry> => {
  const url = `${API_BASE_URL}/food-logs`;
  return fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, auth);
};

export const getFoodLogEntriesAPI = async (
  date: string, // YYYY-MM-DD
  auth: AuthContextType
): Promise<FoodLogEntry[]> => {
  const url = `${API_BASE_URL}/food-logs?date=${date}`;
  return fetchWithAuth(url, { method: 'GET' }, auth);
};

export const deleteFoodLogEntryAPI = async (
  logEntryId: number,
  auth: AuthContextType
): Promise<{ success: boolean, message: string }> => { // Backend returns specific message object for delete
  const url = `${API_BASE_URL}/food-logs/${logEntryId}`;
  
  // Re-implement fetch directly for DELETE if fetchWithAuth isn't flexible enough for non-data responses
   const headers = new Headers();
   if (auth.token) {
       headers.append('Authorization', `Bearer ${auth.token}`);
   }
   headers.append('Accept', 'application/json'); // Expect a JSON response

   console.log(`deleteFoodLogEntryAPI: Calling DELETE ${url}`);

   const response = await fetch(url, { method: 'DELETE', headers });
   const responseData = await response.json(); // Always expect JSON for success/error messages

   if (!response.ok || !responseData.success) {
       console.error(`API Error on DELETE (${url}): ${response.status}`, responseData);
       throw new Error(responseData.message || `Request failed with status ${response.status}`);
   }
   return responseData; // This should be { success: true, message: "..." }
};