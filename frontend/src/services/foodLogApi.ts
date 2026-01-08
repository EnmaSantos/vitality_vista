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
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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