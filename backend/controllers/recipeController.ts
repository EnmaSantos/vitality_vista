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

// Rough conversion factors
const OZ_TO_GRAMS = 28.3495;
const LB_TO_GRAMS = 453.592;
const CUP_TO_GRAMS_FLOUR = 120; // Very rough average
const CUP_TO_GRAMS_SUGAR = 200; // Very rough average
const CUP_TO_GRAMS_LIQUID = 240; // ~240ml
const TBSP_TO_GRAMS_LIQUID = 15; // ~15ml
const TSP_TO_GRAMS_LIQUID = 5;   // ~5ml
const TSP_TO_GRAMS_SPICE = 2;    // Very rough for dense spice/herb
const GRAMS_PER_LASAGNE_SHEET = 25; // Example average
const GRAMS_PER_CARROT = 70;       // Example average medium carrot
const GRAMS_PER_ONION = 150;       // Example average medium onion

interface ParsedMeasure {
  quantity: number | null;
  unit: string | null;
  estimatedGrams: number | null;
  parseNotes: string[];
}

function parseMeasureToGrams(measureText: string, ingredientName: string): ParsedMeasure {
  const notes: string[] = [];
  let estimatedGrams: number | null = null;
  let quantity: number | null = null;
  let unit: string | null = null;

  measureText = measureText.toLowerCase().trim();
  ingredientName = ingredientName.toLowerCase();

  // Attempt to extract a leading number (integer, decimal, fraction like "1/2", "1 1/2")
  const quantityMatch = measureText.match(/^(\d+\s*\d\/\d|\d+\/\d|\d*\.?\d+)/);
  let numericPart = 1; // Default to 1 if no number found but unit exists (e.g. "a cup")
  let remainingText = measureText;

  if (quantityMatch && quantityMatch[0]) {
    const qStr = quantityMatch[0].trim();
    if (qStr.includes(" ")) { // handles "1 1/2"
        const parts = qStr.split(" ");
        const whole = parseFloat(parts[0]);
        const fracParts = parts[1].split("/");
        numericPart = whole + (parseFloat(fracParts[0]) / parseFloat(fracParts[1]));
    } else if (qStr.includes("/")) { // handles "1/2"
        const fracParts = qStr.split("/");
        numericPart = parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
    } else {
        numericPart = parseFloat(qStr);
    }
    quantity = numericPart;
    remainingText = measureText.substring(qStr.length).trim();
  }

  unit = remainingText === "" ? null : remainingText;

  // 1. Direct Grams
  if (remainingText.match(/^g(ram(s)?)?$/)) {
    estimatedGrams = numericPart;
    unit = "g";
    notes.push(`Directly parsed ${numericPart}g.`);
  }
  // 2. Direct Milliliters (assume 1g/ml for liquids)
  else if (remainingText.match(/^ml$/) && quantity) {
    estimatedGrams = numericPart; // 1ml water/milk ~ 1g
    unit = "ml";
    notes.push(`Parsed ${numericPart}ml, assuming ~${estimatedGrams}g (1g/ml density).`);
  }
  // 3. Ounces
  else if (remainingText.match(/^oz|ounce(s)?$/) && quantity) {
    estimatedGrams = numericPart * OZ_TO_GRAMS;
    unit = "oz";
    notes.push(`Parsed ${numericPart}oz, converted to ~${estimatedGrams.toFixed(1)}g.`);
  }
  // 4. Pounds
  else if (remainingText.match(/^lb(s)?|pound(s)?$/) && quantity) {
    estimatedGrams = numericPart * LB_TO_GRAMS;
    unit = "lb";
    notes.push(`Parsed ${numericPart}lb, converted to ~${estimatedGrams.toFixed(1)}g.`);
  }
  // 5. Cups (Highly ingredient dependent - very rough estimates)
  else if (remainingText.match(/^c(up(s)?)?$/) && quantity) {
    unit = "cup";
    if (ingredientName.includes("flour")) estimatedGrams = numericPart * CUP_TO_GRAMS_FLOUR;
    else if (ingredientName.includes("sugar")) estimatedGrams = numericPart * CUP_TO_GRAMS_SUGAR;
    else if (ingredientName.includes("lentil") || ingredientName.includes("bean")) estimatedGrams = numericPart * 200; // Approx raw
    else if (ingredientName.includes("milk") || ingredientName.includes("water") || ingredientName.includes("broth") || ingredientName.includes("puree")) estimatedGrams = numericPart * CUP_TO_GRAMS_LIQUID;
    else notes.push(`Cup conversion to grams for '${ingredientName}' is ambiguous.`);
    if(estimatedGrams) notes.push(`Parsed ${numericPart} cup(s) of ${ingredientName}, estimated ~${estimatedGrams.toFixed(1)}g.`);
  }
  // 6. Tablespoons (rough liquid estimate)
  else if (remainingText.match(/^tbsp|tablespoon(s)?$/) && quantity) {
    unit = "tbsp";
    if (ingredientName.includes("oil") || ingredientName.includes("butter") || ingredientName.includes("syrup")) estimatedGrams = numericPart * 14; // fats
    else if (ingredientName.includes("flour")) estimatedGrams = numericPart * 8; // flour is lighter
    else if (ingredientName.includes("sugar")) estimatedGrams = numericPart * 12; // sugar
    else estimatedGrams = numericPart * TBSP_TO_GRAMS_LIQUID; // default liquid
    notes.push(`Parsed ${numericPart} tbsp, estimated ~${estimatedGrams.toFixed(1)}g.`);
  }
  // 7. Teaspoons (rough liquid/spice estimate)
  else if (remainingText.match(/^tsp|teaspoon(s)?$/) && quantity) {
    unit = "tsp";
    if (ingredientName.includes("oil") || ingredientName.includes("butter")) estimatedGrams = numericPart * 4.5; // fats
    else if (ingredientName.includes("salt")) estimatedGrams = numericPart * 6;
    else if (ingredientName.includes("spice") || ingredientName.includes("herb") || ingredientName.includes("powder") || ingredientName.includes("yeast") || ingredientName.includes("mustard") || ingredientName.includes("vinegar")) estimatedGrams = numericPart * TSP_TO_GRAMS_SPICE;
    else estimatedGrams = numericPart * TSP_TO_GRAMS_LIQUID; // default liquid
    notes.push(`Parsed ${numericPart} tsp, estimated ~${estimatedGrams.toFixed(1)}g.`);
  }
  // 8. Count-based items (very rough estimates)
  else if (quantity && (remainingText === "" || remainingText.match(/^(small|medium|large)?$/)) ) { // e.g. "1", "1 small"
      unit = "count"; // or remainingText if it's small/medium/large
      if (ingredientName.includes("carrot")) estimatedGrams = numericPart * GRAMS_PER_CARROT;
      else if (ingredientName.includes("onion")) estimatedGrams = numericPart * GRAMS_PER_ONION;
      else if (ingredientName.includes("zucchini") && remainingText.includes("small")) estimatedGrams = numericPart * 150; // small zucchini
      else if (ingredientName.includes("zucchini")) estimatedGrams = numericPart * 200; // medium zucchini
      else if (ingredientName.includes("lasagne sheet")) estimatedGrams = numericPart * GRAMS_PER_LASAGNE_SHEET;
      else if (ingredientName.includes("clove") && ingredientName.includes("garlic")) estimatedGrams = numericPart * 5; // garlic clove
      else notes.push(`Count-based measure for '${ingredientName}' ('${measureText}') is ambiguous.`);
      if(estimatedGrams) notes.push(`Parsed count ${numericPart} of ${ingredientName}, estimated ~${estimatedGrams.toFixed(1)}g.`);
  }
  // 9. Descriptive/unparseable
  else if (remainingText.match(/^(sprinking|pinch|dash|to taste|a bit)/)) {
    unit = remainingText;
    estimatedGrams = 2; // token amount for seasoning
    notes.push(`Parsed descriptive measure '${measureText}', assumed ~2g.`);
  }

  if (estimatedGrams === null) {
    notes.push(`Could not parse measure '${measureText}' for ingredient '${ingredientName}' to grams.`);
  }

  return { quantity, unit, estimatedGrams, parseNotes: notes };
}

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
  const recipeId = ctx.params.id;
  try {
    const userId = ctx.state.userId;
    if (!recipeId) {
      console.error("Error: recipeId parameter missing...");
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Recipe ID is required." };
      return;
    }
    console.log(`Attempting to estimate calories for recipe ID: ${recipeId} by User ID: ${userId}`);
    
    const meal: MealDbMeal | null = await getMealById(recipeId);
    if (!meal) {
       console.log(`Recipe with ID ${recipeId} not found...`);
       ctx.response.status = 404;
       ctx.response.body = { success: false, message: `Recipe with ID ${recipeId} not found.` };
       return;
    }
    console.log(`Found recipe: ${meal.strMeal}`);

    let estimatedTotalCalories = 0;
    // Add 'parsedMeasureInfo' and 'calculatedCalories' to IngredientDetail
    type IngredientDetail = {
      ingredient: string;
      measure: string;
      status: string;
      fdcId?: number;
      caloriesPer100g?: number;
      parsedMeasureInfo?: ParsedMeasure; // Store parsing results
      calculatedCalories?: number;      // Store calculated calories for this ingredient
      error?: string;
    };
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

    // --- Step 3c: Process Each Ingredient (USDA Lookup & Calculation) ---
    console.log("Processing ingredients (USDA lookup, measure parsing, calorie calculation)...");
    await Promise.all(ingredientProcessingDetails.map(async (item) => {
      try {
        item.status = "processing_usda";
        const searchResult = await searchFoods(item.ingredient, 1, 1);
        if (!searchResult || searchResult.foods.length === 0) {
          item.status = "usda_not_found"; 
          return;
        }
        
        const fdcId = searchResult.foods[0].fdcId;
        item.fdcId = fdcId;
        item.status = "usda_matched";
        
        const foodDetails = await getFoodDetails(fdcId);
        if (!foodDetails || !foodDetails.foodNutrients) {
          item.status = "usda_details_error"; 
          return;
        }
        
        const calorieNutrient = foodDetails.foodNutrients.find(n =>
          (n.nutrient?.number === '1008' || n.nutrient?.number === '208' || n.nutrient?.name?.toLowerCase().includes('energy')) &&
          n.nutrient?.unitName?.toLowerCase() === 'kcal'
        );
        
        let kcalValue: number | undefined;
        if (calorieNutrient?.amount !== undefined) kcalValue = calorieNutrient.amount;
        else if (calorieNutrient?.nutrient?.id !== undefined && foodDetails.labelNutrients) {
             const labelNutrient = foodDetails.labelNutrients[`${calorieNutrient.nutrient.id}`];
             if (labelNutrient?.value !== undefined) kcalValue = labelNutrient.value;
        }
        
        if (typeof kcalValue !== 'number') {
          item.status = "calories_not_found"; 
          return;
        }
        
        item.caloriesPer100g = kcalValue;
        item.status = "nutrition_found"; // Nutrition data per 100g is found

        // Parse Measure & Calculate Calories for this ingredient
        item.parsedMeasureInfo = parseMeasureToGrams(item.measure, item.ingredient);

        if (item.parsedMeasureInfo.estimatedGrams !== null && item.caloriesPer100g !== undefined) {
          item.calculatedCalories = (item.parsedMeasureInfo.estimatedGrams / 100) * item.caloriesPer100g;
          item.status = "calculated";
          console.log(` -> ${item.ingredient}: ${item.parsedMeasureInfo.estimatedGrams}g, ${item.caloriesPer100g}kcal/100g = ${item.calculatedCalories.toFixed(0)}kcal. Notes: ${item.parsedMeasureInfo.parseNotes.join(' ')}`);
        } else {
          item.status = "measure_parse_failed";
          item.error = `Measure parsing failed. Notes: ${item.parsedMeasureInfo.parseNotes.join(' ')}`;
          console.warn(` -> Failed to parse measure or missing calories for ${item.ingredient}. Measure: "${item.measure}". Notes: ${item.parsedMeasureInfo.parseNotes.join(' ')}`);
        }

      } catch (ingredientError) {
        item.status = "processing_error";
        item.error = ingredientError instanceof Error ? ingredientError.message : "Unknown processing error";
        console.error(`Error processing ingredient "${item.ingredient}":`, item.error);
      }
    })); // End of Promise.all / map loop
    console.log("Finished processing individual ingredients.");

    // --- Step 3d: Sum Total Calories ---
    // Sum up the calories from successfully calculated ingredients
    ingredientProcessingDetails.forEach(item => {
      if (item.calculatedCalories !== undefined) {
        estimatedTotalCalories += item.calculatedCalories;
      }
    });
    console.log(`Total Estimated Calories: ${estimatedTotalCalories.toFixed(0)}`);

    // --- Step 3e: Prepare Response ---
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        recipeId: recipeId,
        recipeName: meal.strMeal,
        estimatedTotalCalories: parseFloat(estimatedTotalCalories.toFixed(0)), // Return rounded to whole number
        ingredients: ingredientProcessingDetails,
      },
    };

  } catch (error) {
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