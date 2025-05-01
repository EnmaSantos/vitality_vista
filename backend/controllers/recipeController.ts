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
  const recipeId = ctx.params.id; // Define recipeId outside try block
  try {
    const userId = ctx.state.userId; // Get user ID from authMiddleware

    if (!recipeId) {
      console.error("Error: recipeId parameter missing...");
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Recipe ID is required." };
      return;
    }

    console.log(`Attempting to estimate calories for recipe ID: ${recipeId} by User ID: ${userId}`);

    // --- Step 3a: Fetch Recipe Details ---
    const meal: MealDbMeal | null = await getMealById(recipeId);

    if (!meal) {
       console.log(`Recipe with ID ${recipeId} not found...`);
       ctx.response.status = 404;
       ctx.response.body = { success: false, message: `Recipe with ID ${recipeId} not found.` };
       return;
    }

    console.log(`Found recipe: ${meal.strMeal}`);

    // --- Initialize variables for calculation ---
    let estimatedTotalCalories = 0;
    // Added fdcId, caloriesPer100g, error fields to the type
    type IngredientDetail = { ingredient: string; measure: string; status: string; fdcId?: number, caloriesPer100g?: number, error?: string };
    const ingredientProcessingDetails: IngredientDetail[] = [];

    // --- Step 3b: Extract Ingredients and Measures ---
    console.log("Extracting ingredients and measures...");
    for (let i = 1; i <= 20; i++) {
      const ingredientKey = `strIngredient${i}` as keyof MealDbMeal;
      const measureKey = `strMeasure${i}` as keyof MealDbMeal;
      const ingredientName = meal[ingredientKey] as string | null;
      const measureText = meal[measureKey] as string | null;

      if (ingredientName && ingredientName.trim() !== "" && measureText && measureText.trim() !== "") {
        ingredientProcessingDetails.push({
          ingredient: ingredientName.trim(),
          measure: measureText.trim(),
          status: "pending",
        });
      } else if (ingredientName === null || ingredientName.trim() === "") {
         break;
      }
    }
    console.log(`Extracted ${ingredientProcessingDetails.length} ingredient pairs.`);


    // ---> *** ADDED: Step 3c: Process Each Ingredient (USDA Lookup Loop) *** <---
    console.log("Processing ingredients via USDA API...");
    // Use Promise.all to run lookups concurrently for better performance
    await Promise.all(ingredientProcessingDetails.map(async (item) => {
        try {
            item.status = "processing";
            // Match Ingredient -> USDA FDC ID (Basic "first result" matching)
            // console.log(`Searching USDA for: ${item.ingredient}`); // Optional: less console noise
            const searchResult = await searchFoods(item.ingredient, 1, 1); // Search for top 1 result

            if (!searchResult || searchResult.foods.length === 0) {
                // console.log(` -> No USDA match found for ${item.ingredient}`); // Optional log
                item.status = "usda_not_found";
                return; // Stop processing this item
            }

            // Take the first result's FDC ID
            const fdcId = searchResult.foods[0].fdcId;
            item.fdcId = fdcId; // Store the matched ID
            const matchedDesc = searchResult.foods[0].description; // Get description for logging
            item.status = "usda_matched";
            // console.log(` -> Matched ${item.ingredient} to FDC ID: ${fdcId} (${matchedDesc})`); // Optional log

            // Fetch Nutrition -> Calories/100g (USDA)
            const foodDetails = await getFoodDetails(fdcId);
            if (!foodDetails || !foodDetails.foodNutrients) {
                console.warn(` -> Could not fetch details or nutrients for FDC ID: ${fdcId} (${item.ingredient} / ${matchedDesc})`); // Warning log
                item.status = "usda_details_error";
                return; // Stop processing this item
            }

            // Find the calorie information (Nutrient "Energy" in kcal per 100g)
            // Common nutrient numbers for Energy: 1008 (old), 208 (new). Also check name. Unit MUST be kcal.
            const calorieNutrient = foodDetails.foodNutrients.find(n =>
                ( n.nutrient?.number === '1008' || // Standard Reference Legacy, FNDDS, Survey
                  n.nutrient?.number === '208' ||  // Foundation, Branded
                  n.nutrient?.name?.toLowerCase().includes('energy') // General fallback name check
                 ) && n.nutrient?.unitName?.toLowerCase() === 'kcal'
            );

            // Check amount exists (sometimes labelNutrients might be used)
            let kcalValue: number | undefined = undefined;
            if (calorieNutrient?.amount !== undefined) {
                kcalValue = calorieNutrient.amount;
            } else if (calorieNutrient?.nutrient?.id !== undefined && foodDetails.labelNutrients) {
                 // Fallback for some Branded foods using labelNutrients structure
                 const labelNutrient = foodDetails.labelNutrients[`${calorieNutrient.nutrient.id}`];
                 if (labelNutrient?.value !== undefined) {
                    kcalValue = labelNutrient.value;
                 }
            }


            if (typeof kcalValue !== 'number') {
                 console.warn(` -> Calories (kcal) not found or invalid for FDC ID: ${fdcId} (${item.ingredient} / ${matchedDesc})`); // Warning log
                 item.status = "calories_not_found";
                 return; // Stop processing this item
            }

            item.caloriesPer100g = kcalValue; // Store calories per 100g
            item.status = "nutrition_found"; // Ready for calculation (once parsing is done)
            // console.log(` -> Found ${item.caloriesPer100g} kcal per 100g for ${item.ingredient}`); // Optional log

            // a. Parse Measure -> Grams (HARD - TODO)
            // d. Calculate Ingredient Calories (Depends on parsing - TODO)


        } catch (ingredientError) {
            console.error(`Error processing ingredient "${item.ingredient}":`, ingredientError);
            item.status = "processing_error";
            item.error = ingredientError instanceof Error ? ingredientError.message : "Unknown processing error";
        }
    })); // End of Promise.all / map loop
    console.log("Finished processing ingredients.");
    // ---> *** END ADDED: Step 3c (Initial USDA Lookup Part) *** <---


    // --- TODO: Step 3d: Sum Total Calories ---


    // --- Step 3e: Prepare Response ---
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        recipeId: recipeId,
        recipeName: meal.strMeal,
        estimatedTotalCalories: estimatedTotalCalories, // Still 0
        ingredients: ingredientProcessingDetails, // Now includes updated status, fdcId, caloriesPer100g, errors
      },
    };

  } catch (error) {
    // ... (catch block remains the same) ...
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