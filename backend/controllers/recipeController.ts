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
 * PROTECTED route - requires authentication.
 */
export async function estimateRecipeCaloriesHandler(ctx: Context<AppState>) {
  const recipeId = ctx.params.id; // Define recipeId outside try block to access in catch
  try {
    // const recipeId = ctx.params.id; // Get recipe ID from route param - Moved outside
    const userId = ctx.state.userId; // Get user ID from authMiddleware (type is now known)

    if (!recipeId) {
      console.error("Error: recipeId parameter missing in route context for calorie estimation");
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Recipe ID is required." };
      return;
    }

    console.log(`Attempting to estimate calories for recipe ID: ${recipeId} by User ID: ${userId}`);

    // --- Step 3a: Fetch Recipe Details ---
    const meal: MealDbMeal | null = await getMealById(recipeId);

    // ---> Handle recipe not found <---
    if (!meal) {
      console.log(`Recipe with ID ${recipeId} not found in TheMealDB.`);
      ctx.response.status = 404; // Not Found
      ctx.response.body = { success: false, message: `Recipe with ID ${recipeId} not found.` };
      return;
    }
    // ---> END Handle recipe not found <---

    console.log(`Found recipe: ${meal.strMeal}`); // <-- *** ADDED THIS LINE ***

    // --- Initialize variables for calculation ---
    // Using const for now as it's not reassigned yet. Will change back to let when calculation is added.
    const estimatedTotalCalories = 0; // Will update later // <-- *** MODIFIED let to const ***
    // Changed placeholder report to an array to hold details per ingredient later
    const ingredientProcessingDetails: { ingredient: string; measure: string; status: string; calories?: number }[] = []; // <-- *** MODIFIED THIS LINE ***

    // --- TODO: Step 3b: Extract Ingredients and Measures ---
    // --- TODO: Step 3c: Process Each Ingredient (Loop) ---
    // --- TODO: Step 3d: Sum Total Calories ---


    // --- Step 3e: Prepare Response ---
    ctx.response.status = 200; // OK
    ctx.response.body = { // <-- *** MODIFIED RESPONSE STRUCTURE ***
      success: true,
      data: {
        recipeId: recipeId,
        recipeName: meal.strMeal, // Added recipe name
        estimatedTotalCalories: estimatedTotalCalories,
        ingredients: ingredientProcessingDetails, // Changed from 'notes'
      },
    }; // <-- *** END MODIFIED RESPONSE STRUCTURE ***

  } catch (error) { // <-- *** MODIFIED CATCH BLOCK ***
    // Use recipeId variable defined outside the try block
    console.error(`Error in estimateRecipeCaloriesHandler for ID ${recipeId}:`, error); // <-- *** MODIFIED ctx.params.id to recipeId ***
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
  } // <-- *** END MODIFIED CATCH BLOCK ***
}

// Add more handlers here later for listCategories, filterByCategory etc.
// export async function listCategoriesHandler(ctx: Context) { ... }
// export async function filterRecipesByCategoryHandler(ctx: Context) { ... }