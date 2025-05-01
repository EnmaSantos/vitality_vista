// backend/controllers/recipeController.ts

import { Context, State } from "../deps.ts"; // Import Oak's Context and State types
import {
  searchMealsByName,
  getMealById,
  // We might need the MealDbMeal interface if we do transformations here,
  // but often we can just pass the service result directly.
  // MealDbMeal,
} from "../services/theMealDbApi.ts"; // Import the service functions
import { searchFoods, getFoodDetails } from "../services/usdaApi.ts"; // <-- Added this import
import type { MealDbMeal } from "../services/theMealDbApi.ts"; // <-- Added this type import

// Define an interface for the application state, including the userId added by middleware
interface AppState extends State {
  userId: string;
}

/**
 * Handles requests to search for recipes by name.
 * Expects a 'name' query parameter (e.g., /api/recipes/search?name=chicken)
 */
export async function searchRecipesHandler(ctx: Context) {
  try {
    const searchParams = ctx.request.url.searchParams;
    const name = searchParams.get("name"); // Get 'name' query parameter

    if (!name || name.trim() === "") {
      ctx.response.status = 400; // Bad Request
      ctx.response.body = { success: false, message: "Missing 'name' query parameter" };
      return;
    }

    // Call the service function
    const meals = await searchMealsByName(name);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: meals || [], // Return the meals array or an empty array if null
    };

  } catch (error) {
    console.error("Error in searchRecipesHandler:", error);
    ctx.response.status = 500; // Internal Server Error
    ctx.response.body = {
      success: false,
      message: "Server error searching recipes",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles requests to get a specific recipe by its ID.
 * Expects the ID as a route parameter (e.g., /api/recipes/52771)
 */
export async function getRecipeByIdHandler(ctx: Context) {
  try {
    // Oak automatically puts matched route parameters into ctx.params
    const id = ctx.params.id;

    if (!id) {
       // This usually indicates a routing setup issue rather than a client error
       console.error("Error: ID parameter missing in route context");
       ctx.response.status = 500;
       ctx.response.body = { success: false, message: "Server configuration error: Missing ID parameter" };
       return;
    }

    // Call the service function
    const meal = await getMealById(id);

    if (!meal) {
      ctx.response.status = 404; // Not Found
      ctx.response.body = { success: false, message: `Recipe with ID ${id} not found` };
      return;
    }

    // If found, return the meal data
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: meal,
    };

  } catch (error) {
    console.error(`Error in getRecipeByIdHandler for ID ${ctx.params.id}:`, error);
    ctx.response.status = 500; // Internal Server Error
    ctx.response.body = {
      success: false,
      message: "Server error retrieving recipe",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles requests to estimate calories for a specific recipe ID.
 * Expects the ID as a route parameter (e.g., /recipes/52771/estimate-calories)
 * PROTECTED route - requires authentication. */
export async function estimateRecipeCaloriesHandler(ctx: Context<AppState>) {
  const recipeId = ctx.params.id; // Define recipeId outside try block
  try {
    const userId = ctx.state.userId; // Get user ID from authMiddleware

    if (!recipeId) {
      // (recipeId check remains the same)
      console.error("Error: recipeId parameter missing in route context for calorie estimation");
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Recipe ID is required." };
      return;
    }

    console.log(`Attempting to estimate calories for recipe ID: ${recipeId} by User ID: ${userId}`);

    // --- Step 3a: Fetch Recipe Details ---
    const meal: MealDbMeal | null = await getMealById(recipeId);

    if (!meal) {
      // (not found check remains the same)
      console.log(`Recipe with ID ${recipeId} not found in TheMealDB.`);
      ctx.response.status = 404;
      ctx.response.body = { success: false, message: `Recipe with ID ${recipeId} not found.` };
      return;
    }

    console.log(`Found recipe: ${meal.strMeal}`);

    // --- Initialize variables for calculation ---
    let estimatedTotalCalories = 0;
    // Define the type more explicitly for clarity
    type IngredientDetail = { ingredient: string; measure: string; status: string; calories?: number };
    const ingredientProcessingDetails: IngredientDetail[] = [];

    // ---> *** ADDED: Step 3b: Extract Ingredients and Measures *** <---
    console.log("Extracting ingredients and measures...");
    for (let i = 1; i <= 20; i++) {
      // Dynamically access properties like strIngredient1, strMeasure1, etc.
      // Use 'as keyof MealDbMeal' for type safety or 'any' if less strictness is needed
      const ingredientKey = `strIngredient${i}` as keyof MealDbMeal;
      const measureKey = `strMeasure${i}` as keyof MealDbMeal;

      const ingredientName = meal[ingredientKey] as string | null;
      const measureText = meal[measureKey] as string | null;

      // Only add if both ingredient and measure are valid, non-empty strings
      if (ingredientName && ingredientName.trim() !== "" && measureText && measureText.trim() !== "") {
        ingredientProcessingDetails.push({
          ingredient: ingredientName.trim(),
          measure: measureText.trim(),
          status: "pending", // Mark as pending for processing
        });
      } else {
        // Optional: Stop processing if we hit a null/empty ingredient,
        // as TheMealDB lists them consecutively.
        if (ingredientName === null || ingredientName.trim() === "") {
             break; // Exit the loop early
        }
      }
    }
    console.log(`Extracted ${ingredientProcessingDetails.length} ingredient pairs.`);
    // ---> *** END ADDED: Step 3b *** <---

    // --- TODO: Step 3c: Process Each Ingredient (Loop through ingredientProcessingDetails) ---
        // a. Parse Measure -> Grams (HARD)
        // b. Match Ingredient -> USDA FDC ID (HARD)
        // c. Fetch Nutrition -> Calories/100g (USDA)
        // d. Calculate Ingredient Calories
    // --- TODO: Step 3d: Sum Total Calories ---


    // --- Step 3e: Prepare Response ---
    ctx.response.status = 200; // OK
    ctx.response.body = {
      success: true,
      data: {
        recipeId: recipeId,
        recipeName: meal.strMeal,
        estimatedTotalCalories: estimatedTotalCalories, // Still 0 for now
        // Now includes the extracted ingredients list (still pending processing)
        ingredients: ingredientProcessingDetails,
      },
    };

  } catch (error) {
    // ... (catch block remains the same)
     console.error(`Error in estimateRecipeCaloriesHandler for ID ${recipeId}:`, error);
     // Distinguish between a Fetch error from getMealById and other errors
     if (error instanceof Error && error.message.includes("TheMealDB request failed")) {
          ctx.response.status = 502; // Bad Gateway might be appropriate
          ctx.response.body = { success: false, message: "Failed to fetch recipe details from external service."};
     } else {
         ctx.response.status = 500; // Internal Server Error
         ctx.response.body = {
           success: false,
           message: "Server error estimating recipe calories",
           error: error instanceof Error ? error.message : "Unknown error",
         };
     }
  }
}

// Add more handlers here later for listCategories, filterByCategory etc.
// export async function listCategoriesHandler(ctx: Context) { ... }
// export async function filterRecipesByCategoryHandler(ctx: Context) { ... }