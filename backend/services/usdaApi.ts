// backend/services/usdaApi.ts
import { loadEnv } from "../deps.ts"; // Import loadEnv [cite: vitality_vista.zip/backend/deps.ts]

// --- Load Environment Variables ---
// Explicitly load environment variables from .env file within this module first
await loadEnv({ export: true });

// --- USDA API Configuration ---
const USDA_API_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const USDA_API_KEY = Deno.env.get("USDA_API");

// Validate API Key
if (!USDA_API_KEY) {
  console.error(
    "Error: Missing required environment variable: USDA_API",
  );
  // Consider throwing an error or handling this more robustly
}

// --- REFINED Interfaces based on actual API response ---

// Represents a nutrient within a food item
interface UsdaFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  derivationCode?: string;
  derivationDescription?: string;
  derivationId?: number;
  value: number;
  foodNutrientSourceId?: number;
  foodNutrientSourceCode?: string;
  foodNutrientSourceDescription?: string;
  rank?: number;
  indentLevel?: number;
  foodNutrientId: number; // Note: This seems like an internal ID for the FoodNutrient entry itself
  percentDailyValue?: number;
  // Added based on potential structure in detail view (nested nutrient object)
  nutrient?: {
      id: number;
      number: string;
      name: string;
      rank: number;
      unitName: string;
  };
  amount?: number; // Detail view seems to use 'amount' instead of 'value' sometimes
  type?: string; // e.g., "FoodNutrient"
  foodNutrientDerivation?: { // Detail view has nested derivation
      id: number;
      code: string;
      description: string;
  };

}

// Represents a food item - refined based on search result example
interface UsdaFoodItem {
  fdcId: number;
  description: string;
  dataType: string;
  gtinUpc?: string;
  publishedDate?: string;
  brandOwner?: string;
  brandName?: string;
  ingredients?: string;
  marketCountry?: string;
  foodCategory?: string;
  modifiedDate?: string;
  dataSource?: string;
  packageWeight?: string;
  servingSizeUnit?: string;
  servingSize?: number;
  householdServingFullText?: string;
  tradeChannels?: string[];
  allHighlightFields?: string;
  score?: number;
  foodNutrients?: UsdaFoodNutrient[]; // Array of nutrients
  // Adding other fields seen in the detailed response example you posted previously
  discontinuedDate?: string;
  foodComponents?: any[]; // Define further if needed
  foodAttributes?: any[]; // Define further if needed
  foodPortions?: any[]; // Define further if needed
  foodClass?: string;
  foodUpdateLog?: any[]; // Define further if needed
  labelNutrients?: Record<string, {value: number}>; // Structure seen in detail example
  // ... other fields might exist in detail view ...
}

// Represents the overall structure of the /foods/search response - seems accurate
interface UsdaSearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  pageList: number[];
  foodSearchCriteria: {
    query: string;
    generalSearchInput: string;
    pageNumber: number;
    numberOfResultsPerPage: number;
    pageSize: number;
    requireAllWords: boolean;
  };
  foods: UsdaFoodItem[];
  aggregations?: {
    dataType?: Record<string, number>;
    nutrients?: Record<string, any>;
  };
}

// --- API Service Functions ---

/**
 * Searches the USDA FoodData Central database.
 * @param query The search term.
 * @param pageNumber Page number (default 1).
 * @param pageSize Results per page (default 10).
 * @returns Promise resolving to search results or null.
 */
export async function searchFoods(
    query: string,
    pageNumber: number = 1,
    pageSize: number = 10
): Promise<UsdaSearchResponse | null> {
  if (!USDA_API_KEY) {
    console.error("USDA API Key is missing. Cannot perform search.");
    return null;
  }
  const params = new URLSearchParams({
    query: query,
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
    api_key: USDA_API_KEY,
  });
  const url = `${USDA_API_BASE_URL}/foods/search?${params.toString()}`;
  console.log(`Workspaceing USDA FDC: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`USDA API request failed: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`USDA API request failed: ${response.status}`);
    }
    const data: UsdaSearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`Error searching foods for "${query}":`, error);
    return null;
  }
}

/**
 * Fetches detailed information for a specific food item by its FDC ID.
 * @param fdcId The FoodData Central ID.
 * @returns Promise resolving to detailed food item or null.
 */
export async function getFoodDetails(fdcId: number | string): Promise<UsdaFoodItem | null> {
  if (!USDA_API_KEY) {
    console.error("USDA API Key is missing. Cannot get details.");
    return null;
  }
  const params = new URLSearchParams({ api_key: USDA_API_KEY });
  // Use /food/ endpoint for details
  const url = `${USDA_API_BASE_URL}/food/${fdcId}?${params.toString()}`;
  console.log(`Workspaceing USDA FDC Detail: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`USDA API request failed for ID ${fdcId}: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`USDA API request failed for ID ${fdcId}: ${response.status}`);
    }
    // Detail endpoint returns the UsdaFoodItem directly
    const data: UsdaFoodItem = await response.json();
    // The nutrient structure might be slightly different in detail vs search,
    // Our UsdaFoodNutrient interface tries to accommodate both common patterns
    // based on the earlier examples.
    return data;
  } catch (error) {
    console.error(`Error fetching food details for ID ${fdcId}:`, error);
    return null;
  }
}