// backend/services/theMealDbApi.ts
import { loadEnv } from "../deps.ts"; // Ensure loadEnv is correctly imported from your deps.ts

// It's good practice to load environment variables at the very start of your application,
// typically in your main server.ts. If it's already done there reliably,
// this specific `await loadEnv()` might be redundant here, but doesn't hurt.
await loadEnv({ export: true });

const PREMIUM_API_KEY = Deno.env.get("THEMEALDB_API"); // Should be "65232507"

let API_BASE_URL: string;
let usingPremiumV2 = false;

if (PREMIUM_API_KEY && PREMIUM_API_KEY !== "1" && PREMIUM_API_KEY !== "") { // Ensure key is not empty
  API_BASE_URL = `https://www.themealdb.com/api/json/v2/${PREMIUM_API_KEY}`;
  usingPremiumV2 = true;
  console.log(`TheMealDBApi: Initialized with V2 Premium API Key.`);
} else {
  API_BASE_URL = `https://www.themealdb.com/api/json/v1/1`; // Fallback to V1 free key
  console.log(`TheMealDBApi: Initialized with V1 Free API Key (1). THEMEALDB_API env var was: \'\${PREMIUM_API_KEY}\'`);
}
// Log the base URL structure for verification (key part masked for safety in logs)
console.log(`TheMealDBApi: Effective Base URL structure: ${API_BASE_URL.substring(0, API_BASE_URL.lastIndexOf('/') + 1)}YOUR_KEY_WAS_HERE/...`);


// --- Define Interfaces for API Responses ---

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
  [key: string]: any; // To allow dynamic access like meal[`strIngredient${i}`]
}

interface MealDbFullMealListResponse { // For search.php, randomselection.php
    meals: MealDbFullMeal[] | null;
}

interface MealDbLookupResponse { // For lookup.php
    meals: [MealDbFullMeal] | null;
}

interface MealDbCategoryInfo { // For categories.php
    idCategory: string;
    strCategory: string;
    strCategoryThumb: string;
    strCategoryDescription: string;
}

interface MealDbCategoriesResponse {
    categories: MealDbCategoryInfo[];
}

export interface MealDbSummary { // For filter.php results
    strMeal: string;
    strMealThumb: string;
    idMeal: string;
}

interface MealDbFilterResponse {
    meals: MealDbSummary[] | null;
}

// --- API Service Functions ---

async function fetchFromApi<T>(endpointPath: string, operationName: string): Promise<T> {
  const url = `${API_BASE_URL}/${endpointPath}`;
  // Mask the key in the log for security if it\'s part of the base URL.
  // The current API_BASE_URL includes the key.
  const loggedUrl = API_BASE_URL.includes(PREMIUM_API_KEY || "1") && PREMIUM_API_KEY // Ensure PREMIUM_API_KEY is not null
    ? url.replace(PREMIUM_API_KEY, "YOUR_KEY") 
    : url;
  console.log(`TheMealDBApi: ${operationName}: ${loggedUrl}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`TheMealDB ${operationName} request failed: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`TheMealDB ${operationName} request (${url}) failed: ${response.status}`);
    }
    return await response.json() as T;
  } catch (error) {
    console.error(`Error in ${operationName} calling "${url}":`, error);
    if (error instanceof Error) throw error;
    throw new Error(`Unknown error during ${operationName}.`);
  }
}

export async function searchMealsByName(name: string): Promise<MealDbFullMeal[] | null> {
  const encodedName = encodeURIComponent(name);
  const data = await fetchFromApi<MealDbFullMealListResponse>(`search.php?s=${encodedName}`, "searchMealsByName");
  return data.meals;
}

export async function getMealById(id: string): Promise<MealDbFullMeal | null> {
  const data = await fetchFromApi<MealDbLookupResponse>(`lookup.php?i=${id}`, "getMealById");
  return data.meals ? data.meals[0] : null;
}

export async function listAllCategoriesInfo(): Promise<MealDbCategoryInfo[]> {
  const data = await fetchFromApi<MealDbCategoriesResponse>('categories.php', "listAllCategoriesInfo");
  return data.categories || [];
}

export async function filterByCategory(category: string): Promise<MealDbSummary[] | null> {
  const encodedCategory = encodeURIComponent(category);
  const data = await fetchFromApi<MealDbFilterResponse>(`filter.php?c=${encodedCategory}`, `filterByCategory(${category})`);
  return data.meals;
}

export async function getFeaturedRecipes(): Promise<MealDbFullMeal[] | null> {
  if (!usingPremiumV2) {
    console.warn("TheMealDBApi: randomselection.php is a premium endpoint. Your current API key is not configured as premium V2 or is missing. Falling back to 10 single random.php calls.");
    const randomMeals: MealDbFullMeal[] = [];
    const promises: Promise<MealDbFullMeal | null>[] = [];
    for (let i = 0; i < 10; i++) {
        // getMealById actually calls lookup.php?i=... which expects an ID.
        // For a single random meal, the endpoint is random.php, which returns a structure like lookup.php
        promises.push(
            fetchFromApi<MealDbLookupResponse>(`random.php`, `getFeatured_randomFallback_${i+1}`)
                .then(data => data.meals ? data.meals[0] : null)
        );
    }
    try {
        const results = await Promise.all(promises);
        results.forEach(meal => {
            if (meal) {
                randomMeals.push(meal);
            }
        });
        // Remove duplicates just in case random.php returns the same meal multiple times
        const uniqueMeals = Array.from(new Map(randomMeals.map(meal => [meal.idMeal, meal])).values());
        return uniqueMeals.slice(0, 10);
    } catch (fallbackError) {
        console.error("Error during fallback random.php calls:", fallbackError);
        return null;
    }
  }
  // If premium key is correctly set and usingPremiumV2 is true
  const data = await fetchFromApi<MealDbFullMealListResponse>('randomselection.php', "getFeaturedRecipes (premium)");
  return data.meals;
}

// --- TODO: Add other functions as needed, e.g., for listing by area, ingredient ---