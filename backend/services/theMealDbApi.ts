// backend/services/theMealDbApi.ts

// Base URL for TheMealDB API using the free test key '1'
const API_BASE_URL = "https://www.themealdb.com/api/json/v1/1";

// --- Define Interfaces for API Responses (REFINED) ---

interface MealDbMeal {
  idMeal: string;
  strMeal: string;
  strDrinkAlternate: string | null;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null; // Can be comma-separated string or null
  strYoutube: string | null; // Assuming this can also be null
  strIngredient1: string | null;
  strIngredient2: string | null;
  strIngredient3: string | null;
  strIngredient4: string | null;
  strIngredient5: string | null;
  strIngredient6: string | null;
  strIngredient7: string | null;
  strIngredient8: string | null;
  strIngredient9: string | null;
  strIngredient10: string | null;
  strIngredient11: string | null;
  strIngredient12: string | null;
  strIngredient13: string | null;
  strIngredient14: string | null;
  strIngredient15: string | null;
  strIngredient16: string | null;
  strIngredient17: string | null;
  strIngredient18: string | null;
  strIngredient19: string | null;
  strIngredient20: string | null;
  strMeasure1: string | null;
  strMeasure2: string | null;
  strMeasure3: string | null;
  strMeasure4: string | null;
  strMeasure5: string | null;
  strMeasure6: string | null;
  strMeasure7: string | null;
  strMeasure8: string | null;
  strMeasure9: string | null;
  strMeasure10: string | null;
  strMeasure11: string | null;
  strMeasure12: string | null;
  strMeasure13: string | null;
  strMeasure14: string | null;
  strMeasure15: string | null;
  strMeasure16: string | null;
  strMeasure17: string | null;
  strMeasure18: string | null;
  strMeasure19: string | null;
  strMeasure20: string | null;
  strSource: string | null;
  strImageSource: string | null;
  strCreativeCommonsConfirmed: string | null;
  dateModified: string | null;
}

// These wrapper interfaces still look correct based on the response
interface MealDbSearchResponse {
    meals: MealDbMeal[] | null;
}
interface MealDbLookupResponse {
    meals: [MealDbMeal] | null; // Array with one meal or null
}

// --- NEW Interfaces (Based on observing categories.php and filter.php) ---

interface MealDbCategory {
    idCategory: string;
    strCategory: string;
    strCategoryThumb: string;
    strCategoryDescription: string;
}

interface MealDbCategoriesResponse {
    categories: MealDbCategory[]; // Expect an array of categories
}

// Interface for the summarized meal object returned by filter endpoints
interface MealDbSummary {
    strMeal: string;
    strMealThumb: string;
    idMeal: string;
}

interface MealDbFilterResponse {
    meals: MealDbSummary[] | null; // Filter endpoints return an array of summaries or null
}


// --- API Service Functions ---

/**
 * Searches for meals by name.
 * @param name The search term.
 * @returns Promise resolving to an array of meals or null.
 */
export async function searchMealsByName(name: string): Promise<MealDbMeal[] | null> {
  const encodedName = encodeURIComponent(name);
  const url = `${API_BASE_URL}/search.php?s=${encodedName}`;
  console.log(`Workspaceing TheMealDB: ${url}`); // For debugging

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TheMealDB request failed: ${response.status}`);
    }
    const data: MealDbSearchResponse = await response.json();
    return data.meals; // Return the array of meals, or null if none found
  } catch (error) {
    console.error("Error fetching meals by name:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Looks up a full meal detail by its ID.
 * @param id The meal ID.
 * @returns Promise resolving to a single meal object or null.
 */
export async function getMealById(id: string): Promise<MealDbMeal | null> {
    const url = `${API_BASE_URL}/lookup.php?i=${id}`;
    console.log(`Workspaceing TheMealDB: ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`TheMealDB request failed: ${response.status}`);
      }
      const data: MealDbLookupResponse = await response.json();
      // API returns an array with one item, or null
      return data.meals ? data.meals[0] : null;
    } catch (error) {
        console.error(`Error fetching meal by ID ${id}:`, error);
        throw error;
    }
}

/**
 * Fetches the list of all meal categories.
 * @returns Promise resolving to an array of category objects.
 */
export async function listCategories(): Promise<MealDbCategory[]> {
    const url = `${API_BASE_URL}/categories.php`;
    console.log(`Workspaceing TheMealDB: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`TheMealDB request failed: ${response.status}`);
        }
        const data: MealDbCategoriesResponse = await response.json();
        return data.categories || []; // Return categories array or empty array if null/missing
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
}

/**
 * Filters meals by a specific category.
 * @param category The category name to filter by.
 * @returns Promise resolving to an array of summarized meal objects or null.
 */
export async function filterByCategory(category: string): Promise<MealDbSummary[] | null> {
    const encodedCategory = encodeURIComponent(category);
    const url = `${API_BASE_URL}/filter.php?c=${encodedCategory}`;
    console.log(`Workspaceing TheMealDB: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`TheMealDB request failed: ${response.status}`);
        }
        const data: MealDbFilterResponse = await response.json();
        return data.meals; // Return array of meal summaries or null
    } catch (error) {
        console.error(`Error filtering by category "${category}":`, error);
        throw error;
    }
}

// --- TODO: Add functions for list.php?a=list, list.php?i=list, filter.php?a=..., filter.php?i=... ---
// ...