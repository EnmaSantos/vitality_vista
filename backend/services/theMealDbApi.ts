// backend/services/theMealDbApi.ts
import { loadEnv } from "../deps.ts"; // Ensure loadEnv is correctly imported from your deps.ts

// It's good practice to load environment variables at the very start of your application,
// typically in your main server.ts. If it's already done there reliably,
// this specific `await loadEnv()` might be redundant here, but doesn't hurt.
await loadEnv({ export: true });

const PREMIUM_API_KEY = Deno.env.get("THEMEALDB_API"); // This should be "65232507" from your .env

let API_BASE_URL: string;
let usingPremiumV2 = false;

if (PREMIUM_API_KEY && PREMIUM_API_KEY !== "1") {
  // If a premium key (that isn't "1") is provided, use the V2 path
  API_BASE_URL = `https://www.themealdb.com/api/json/v2/${PREMIUM_API_KEY}`;
  usingPremiumV2 = true;
  console.log(`TheMealDBApi: Initialized with V2 Premium API Key.`);
} else {
  // Fallback to V1 with key "1" if no premium key is set or if it's explicitly "1"
  API_BASE_URL = `https://www.themealdb.com/api/json/v1/1`;
  console.log(`TheMealDBApi: Initialized with V1 Free API Key (1).`);
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

async function fetchFromApi<T>(endpoint: string, operationName: string): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint}`;
  console.log(`TheMealDBApi: ${operationName}: ${url.replace(PREMIUM_API_KEY || "1", "YOUR_KEY")}`); // Mask key in log
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`TheMealDB ${operationName} request failed: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`TheMealDB ${operationName} request failed: ${response.status}`);
    }
    return await response.json() as T;
  } catch (error) {
    console.error(`Error in ${operationName} ("${endpoint}"):`, error);
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
  if (!usingPremiumV2 && PREMIUM_API_KEY === "1") {
    console.warn("TheMealDBApi: randomselection.php is a premium endpoint. Using single random.php 10 times as fallback.");
    // Fallback for free key "1": call random.php multiple times
    const randomMeals: MealDbFullMeal[] = [];
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(fetchFromApi<MealDbLookupResponse>('random.php', `getFeaturedRecipes_randomFallback_${i+1}`));
    }
    const results = await Promise.all(promises);
    results.forEach(result => {
      if (result.meals && result.meals[0]) {
        randomMeals.push(result.meals[0]);
      }
    });
    // Remove duplicates by idMeal if any
    const uniqueMeals = Array.from(new Map(randomMeals.map(meal => [meal.idMeal, meal])).values());
    return uniqueMeals.slice(0,10);
  }
  // If premium key is set (and not "1"), use randomselection.php
  const data = await fetchFromApi<MealDbFullMealListResponse>('randomselection.php', "getFeaturedRecipes (premium)");
  return data.meals;
}

// --- TODO: Add other functions as needed, e.g., for listing by area, ingredient ---