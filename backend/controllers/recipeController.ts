// backend/controllers/recipeController.ts

import { Context } from "../deps.ts"; // Import Oak's Context type
import type { RouterContext } from "../deps.ts"; // Import RouterContext as a type
import {
  searchMealsByName,
  getMealById,
  filterByCategory as filterMealsByCategoryService,
  // We might need the MealDbMeal interface if we do transformations here,
  // but often we can just pass the service result directly.
  // MealDbMeal,
  getFeaturedRecipes as getFeaturedRecipesService
} from "../services/theMealDbApi.ts"; // Import the service functions
import { searchFoods, getFoodDetails } from "../services/usdaApi.ts"; // <-- Added this import
import type { MealDbFullMeal } from "../services/theMealDbApi.ts"; // Use MealDbFullMeal instead of MealDbMeal

// Rough conversion factors
const OZ_TO_GRAMS = 28.3495;
const LB_TO_GRAMS = 453.592;
const KG_TO_GRAMS = 1000; // Added
const CUP_TO_GRAMS_FLOUR = 120; // Very rough average
const CUP_TO_GRAMS_SUGAR = 200; // Very rough average
const CUP_TO_GRAMS_LIQUID = 240; // ~240ml
const CUP_TO_GRAMS_OIL = 224; // Added for oils (approx 0.93g/ml)
const TBSP_TO_GRAMS_LIQUID = 15; // ~15ml
const TSP_TO_GRAMS_LIQUID = 5;   // ~5ml
const TSP_TO_GRAMS_SPICE = 2;    // Very rough for dense spice/herb
const GRAMS_PER_LASAGNE_SHEET = 25; // Example average
const GRAMS_PER_CARROT = 70;       // Example average medium carrot
const GRAMS_PER_ONION = 150;       // Example average medium onion
const GRAMS_PER_LEMON = 120; // Added - average medium lemon
const GRAMS_PER_BAY_LEAF = 0.2; // Added - very light
const GRAMS_PER_GARLIC_CLOVE = 5; // Added for clarity
const GRAMS_PER_STOCK_CUBE = 10; // Added - for "beef stock concentrate" if it's a cube
const GRAMS_PER_CAN_COCONUT_MILK = 400; // Standard 400ml can, density ~1g/ml
const GRAMS_PER_ONION_STICK = 15; // Assuming a green onion / scallion stick
const GRAMS_PER_EGGPLANT = 300; // Average medium eggplant
const GRAMS_PER_GARLIC_BULB = 50; // Average garlic bulb

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
  let numericPart = 1; // Default to 1, will be overridden if a number is found

  measureText = measureText.toLowerCase().trim();
  ingredientName = ingredientName.toLowerCase();

  // Pre-process to handle specific count-based units before general parsing
  // Handle "4 sliced Garlic Clove" or "4 garlic cloves"
  if (ingredientName.includes("garlic clove")) {
    const quantityMatchSimple = measureText.match(/^(\d+\s*\d\/\d|\d+\/\d|\d*\.?\d+)/); 
    if (quantityMatchSimple && quantityMatchSimple[0]) {
        const qStr = quantityMatchSimple[0].trim();
        if (qStr.includes(" ")) { const parts = qStr.split(" "); const whole = parseFloat(parts[0]); const fracParts = parts[1].split("/"); numericPart = whole + (parseFloat(fracParts[0]) / parseFloat(fracParts[1])); }
        else if (qStr.includes("/")) { const fracParts = qStr.split("/"); numericPart = parseFloat(fracParts[0]) / parseFloat(fracParts[1]); }
        else { numericPart = parseFloat(qStr); }
        quantity = numericPart;
        unit = "clove(s)";
        estimatedGrams = numericPart * GRAMS_PER_GARLIC_CLOVE;
        notes.push(`Parsed ${numericPart} clove(s) from ingredient 'garlic clove' (descriptors like '${measureText.replace(qStr, '').trim()}' ignored), estimated ~${estimatedGrams.toFixed(1)}g.`);
        return { quantity, unit, estimatedGrams, parseNotes: notes };
    }
  }
  // Handle cases like "1 onion, chopped" or "1 chopped onion"
  // Updated to be more general for leading number + descriptor + item name
  if ((ingredientName.includes("onion") || ingredientName.includes("bread") || ingredientName.includes("potato") || ingredientName.includes("carrot") || ingredientName.includes("zucchini") || ingredientName.includes("apple") || ingredientName.includes("banana")) && 
      measureText.match(/^(\d+\s*\d\/\d|\d+\/\d|\d*\.?\d+)\s+(sliced|chopped|diced|minced|large|medium|small)/)) {
    const quantityMatchSimple = measureText.match(/^(\d+\s*\d\/\d|\d+\/\d|\d*\.?\d+)/); 
    if (quantityMatchSimple && quantityMatchSimple[0]) {
        const qStr = quantityMatchSimple[0].trim();
        if (qStr.includes(" ")) { const parts = qStr.split(" "); const whole = parseFloat(parts[0]); const fracParts = parts[1].split("/"); numericPart = whole + (parseFloat(fracParts[0]) / parseFloat(fracParts[1])); }
        else if (qStr.includes("/")) { const fracParts = qStr.split("/"); numericPart = parseFloat(fracParts[0]) / parseFloat(fracParts[1]); }
        else { numericPart = parseFloat(qStr); }
        quantity = numericPart;
        unit = ingredientName; // Use the ingredient name as the unit for count
        if (ingredientName.includes("onion")) estimatedGrams = numericPart * GRAMS_PER_ONION;
        else if (ingredientName.includes("bread")) estimatedGrams = numericPart * 30; // Approx 30g per slice as a default
        // Add other specific average weights for other items if needed
        else notes.push(`Parsed ${numericPart} ${ingredientName}(s) with descriptor, gram estimation needed for this item count.`);
        
        if (estimatedGrams) notes.push(`Parsed ${numericPart} ${unit}(s) (descriptors ignored), estimated ~${estimatedGrams.toFixed(1)}g.`);
        else { /* keep the other note */ }
        return { quantity, unit, estimatedGrams, parseNotes: notes };
    }
  }

  // Handle "X sticks" for onions (assuming green onions/scallions)
  if (ingredientName.includes("onion") && measureText.match(/^(\d+\s*\d\/\d|\d+\/\d|\d*\.?\d+)\s+stick(s)?$/)) {
    const quantityMatchSimple = measureText.match(/^(\d+\s*\d\/\d|\d+\/\d|\d*\.?\d+)/);
    if (quantityMatchSimple && quantityMatchSimple[0]) {
        const qStr = quantityMatchSimple[0].trim();
        if (qStr.includes(" ")) { const parts = qStr.split(" "); const whole = parseFloat(parts[0]); const fracParts = parts[1].split("/"); numericPart = whole + (parseFloat(fracParts[0]) / parseFloat(fracParts[1])); }
        else if (qStr.includes("/")) { const fracParts = qStr.split("/"); numericPart = parseFloat(fracParts[0]) / parseFloat(fracParts[1]); }
        else { numericPart = parseFloat(qStr); }
        quantity = numericPart;
        unit = "stick(s)";
        estimatedGrams = numericPart * GRAMS_PER_ONION_STICK;
        notes.push(`Parsed ${numericPart} onion stick(s), assumed green onion/scallion, estimated ~${estimatedGrams.toFixed(1)}g.`);
        return { quantity, unit, estimatedGrams, parseNotes: notes };
    }
  }

  const quantityMatch = measureText.match(/^(\d+\s*\d\/\d|\d+\/\d|\d*\.?\d+)/); // Corrected regex
  let remainingText = measureText;

  if (quantityMatch && quantityMatch[0]) {
    const qStr = quantityMatch[0].trim();
    if (qStr.includes(" ")) { 
        const parts = qStr.split(" ");
        const whole = parseFloat(parts[0]);
        const fracParts = parts[1].split("/");
        numericPart = whole + (parseFloat(fracParts[0]) / parseFloat(fracParts[1]));
    } else if (qStr.includes("/")) { 
        const fracParts = qStr.split("/");
        numericPart = parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
    } else {
        numericPart = parseFloat(qStr);
    }
    quantity = numericPart;
    remainingText = measureText.substring(qStr.length).trim().replace(/^(of|an|a)\s+/,'');
  } else {
    if (measureText.match(/^(a|an)\s+/)) {
        numericPart = 1;
        quantity = 1;
        remainingText = measureText.replace(/^(a|an)\s+/, '').trim();
        notes.push("Assumed quantity of 1 from 'a' or 'an'.");
    }
  }

  unit = remainingText === "" ? null : remainingText;

  if (remainingText.match(/^kg|kilogram(s)?$/)) {
    estimatedGrams = numericPart * KG_TO_GRAMS;
    unit = "kg";
    notes.push(`Parsed ${numericPart}kg, converted to ~${estimatedGrams.toFixed(1)}g.`);
  }
  else if (remainingText.match(/^g(ram(s)?)?$/)) {
    estimatedGrams = numericPart;
    unit = "g";
    notes.push(`Directly parsed ${numericPart}g.`);
  }
  else if (remainingText.match(/^ml|millilitre(s)?|milliliter(s)?$/) && quantity) {
    estimatedGrams = numericPart; 
    unit = "ml";
    notes.push(`Parsed ${numericPart}ml, assuming ~${estimatedGrams}g (1g/ml density default).`);
  }
  else if (remainingText.match(/^oz|ounce(s)?$/) && quantity) {
    estimatedGrams = numericPart * OZ_TO_GRAMS;
    unit = "oz";
    notes.push(`Parsed ${numericPart}oz, converted to ~${estimatedGrams.toFixed(1)}g.`);
  }
  else if (remainingText.match(/^lb(s)?|pound(s)?$/) && quantity) {
    estimatedGrams = numericPart * LB_TO_GRAMS;
    unit = "lb";
    notes.push(`Parsed ${numericPart}lb, converted to ~${estimatedGrams.toFixed(1)}g.`);
  }
  else if (remainingText.match(/^can(s)?$/) && quantity) {
    unit = "can";
    if (ingredientName.includes("coconut milk")) {
        estimatedGrams = numericPart * GRAMS_PER_CAN_COCONUT_MILK;
        notes.push(`Parsed ${numericPart} can(s) of coconut milk, estimated ~${estimatedGrams.toFixed(1)}g.`);
    } else {
        notes.push(`Parsed ${numericPart} can(s) of ${ingredientName}, gram estimation for generic 'can' is ambiguous.`);
    }
  }
  else if (remainingText.match(/^c(up(s)?)?$/) && quantity) {
    unit = "cup";
    if (ingredientName.includes("flour")) { // General flour
        if (ingredientName.includes("buckwheat flour")) estimatedGrams = numericPart * 120; 
        else if (ingredientName.includes("coconut flour")) estimatedGrams = numericPart * 100; 
        else if (ingredientName.includes("almond flour")) estimatedGrams = numericPart * 96;
        else estimatedGrams = numericPart * CUP_TO_GRAMS_FLOUR; // Default all-purpose/wheat flour
    }
    else if (ingredientName.includes("buckwheat")) estimatedGrams = numericPart * 150; // Buckwheat groats/generic if not specified as flour
    else if (ingredientName.includes("sugar")) estimatedGrams = numericPart * CUP_TO_GRAMS_SUGAR;
    else if (ingredientName.includes("lentil") || ingredientName.includes("bean")) estimatedGrams = numericPart * 200; 
    else if (ingredientName.includes("oil") || ingredientName.includes("olive oil")) estimatedGrams = numericPart * CUP_TO_GRAMS_OIL; 
    else if (ingredientName.includes("milk") || ingredientName.includes("water") || ingredientName.includes("broth") || ingredientName.includes("puree") || ingredientName.includes("juice")) estimatedGrams = numericPart * CUP_TO_GRAMS_LIQUID;
    else notes.push(`Cup conversion to grams for \'${ingredientName}\' is ambiguous without more specific type.`);
    if(estimatedGrams) notes.push(`Parsed ${numericPart} cup(s) of ${ingredientName}, estimated ~${estimatedGrams.toFixed(1)}g.`);
  }
  else if (remainingText.match(/^(tbsp|tablespoon(s)?|tbs)$/) && quantity) {
    unit = "tbsp/tbs";
    if (ingredientName.includes("oil") || ingredientName.includes("butter") || ingredientName.includes("syrup") || ingredientName.includes("honey") || ingredientName.includes("peanut butter")) estimatedGrams = numericPart * 14; 
    else if (ingredientName.includes("flour")) estimatedGrams = numericPart * 8; 
    else if (ingredientName.includes("sugar")) estimatedGrams = numericPart * 12; 
    else if (ingredientName.includes("cocoa powder")) estimatedGrams = numericPart * 7;
    else if (ingredientName.includes("cornstarch")) estimatedGrams = numericPart * 8;
    else if (ingredientName.includes("soy sauce") || ingredientName.includes("vinegar") || ingredientName.includes("tomato sauce")) estimatedGrams = numericPart * 16; 
    else estimatedGrams = numericPart * TBSP_TO_GRAMS_LIQUID; 
    notes.push(`Parsed ${numericPart} tbsp/tbs, estimated ~${estimatedGrams.toFixed(1)}g for ${ingredientName}.`);
  }
  else if (remainingText.match(/^tsp|teaspoon(s)?$/) && quantity) {
    unit = "tsp";
    if (ingredientName.includes("oil") || ingredientName.includes("butter")) estimatedGrams = numericPart * 4.5; 
    else if (ingredientName.includes("salt")) estimatedGrams = numericPart * 6;
    else if (ingredientName.includes("sugar")) estimatedGrams = numericPart * 4;
    else if (ingredientName.includes("baking soda") || ingredientName.includes("baking powder")) estimatedGrams = numericPart * 4;
    else if (ingredientName.includes("spice") || ingredientName.includes("herb") || ingredientName.includes("powder") || ingredientName.includes("yeast") || ingredientName.includes("mustard") || ingredientName.includes("vinegar")) estimatedGrams = numericPart * TSP_TO_GRAMS_SPICE;
    else estimatedGrams = numericPart * TSP_TO_GRAMS_LIQUID; 
    notes.push(`Parsed ${numericPart} tsp, estimated ~${estimatedGrams.toFixed(1)}g for ${ingredientName}.`);
  }
  // Handle "whole" garlic (bulb)
  else if (quantity && unit && unit.match(/^whole$/i) && ingredientName.toLowerCase().includes("garlic") && !ingredientName.toLowerCase().includes("clove")) {
    estimatedGrams = numericPart * GRAMS_PER_GARLIC_BULB;
    unit = "whole garlic bulb(s)"; // Update unit to be more specific
    notes.push(`Parsed ${numericPart} ${unit}, estimated ~${estimatedGrams.toFixed(1)}g.`);
  }
  else if (((ingredientName.match(/^egg(s)?$/i) || ingredientName.match(/\begg(s)?\b/i)) && !(ingredientName.includes("eggplant") || ingredientName.includes("egg plant"))) && measureText.match(/^(\d+\s*\d\/\d|\d+\/\d|\d*\.?\d+)\s*(seperated|separated)?$/)) {
    const quantityMatchSimple = measureText.match(/^(\d+\s*\d\/\d|\d+\/\d|\d*\.?\d+)/);
    if (quantityMatchSimple && quantityMatchSimple[0]) {
        const qStr = quantityMatchSimple[0].trim();
        if (qStr.includes(" ")) { const parts = qStr.split(" "); const whole = parseFloat(parts[0]); const fracParts = parts[1].split("/"); numericPart = whole + (parseFloat(fracParts[0]) / parseFloat(fracParts[1])); }
        else if (qStr.includes("/")) { const fracParts = qStr.split("/"); numericPart = parseFloat(fracParts[0]) / parseFloat(fracParts[1]); }
        else { numericPart = parseFloat(qStr); }
        quantity = numericPart;
        unit = "egg(s)";
        estimatedGrams = numericPart * 50; // Assume 50g per whole egg
        notes.push(`Parsed ${numericPart} egg(s); descriptor '${measureText.replace(qStr, '').trim()}' ignored for calorie calculation (using whole egg estimate). Estimated ~${estimatedGrams.toFixed(1)}g.`);
    }
  }
  else if (quantity && (remainingText === "" || remainingText.match(/^(small|medium|large)?(\s+)?(piece(s)?|stick(s)?)?$/) || ingredientName.includes(remainingText.replace(/s$/,'')) )) {
      unit = "count";
      let itemDescriptor = remainingText;
      if (remainingText === "" || remainingText.match(/^(small|medium|large)$/)) {
        itemDescriptor = ingredientName; 
      }

      if (itemDescriptor.includes("carrot")) estimatedGrams = numericPart * GRAMS_PER_CARROT;
      else if (itemDescriptor.includes("zucchini") && (remainingText.includes("small") || ingredientName.includes("small zucchini"))) estimatedGrams = numericPart * 150;
      else if (itemDescriptor.includes("zucchini")) estimatedGrams = numericPart * 200;
      else if (itemDescriptor.includes("lasagne sheet")) estimatedGrams = numericPart * GRAMS_PER_LASAGNE_SHEET;
      else if (itemDescriptor.includes("lemon")) estimatedGrams = numericPart * GRAMS_PER_LEMON;
      else if (itemDescriptor.includes("bay leaf") || itemDescriptor.includes("bayleave")) estimatedGrams = numericPart * GRAMS_PER_BAY_LEAF;
      else if (itemDescriptor.includes("stock cube") || itemDescriptor.includes("bouillon cube") || (ingredientName.includes("stock") && ingredientName.includes("concentrate") && quantity === 1)) { 
        estimatedGrams = numericPart * GRAMS_PER_STOCK_CUBE;
        unit = "stock cube/concentrate unit";
      }
      else if (itemDescriptor.includes("eggplant") || itemDescriptor.includes("egg plant")) { // Handles "eggplant", "egg plants"
        estimatedGrams = numericPart * GRAMS_PER_EGGPLANT;
        notes.push(`Parsed ${numericPart} eggplant(s), estimated ~${(estimatedGrams).toFixed(1)}g.`);
        unit = "eggplant(s)"; // Set unit for clarity
      }
      // Ensure this is for actual eggs and not part of "eggplant"
      else if (itemDescriptor.match(/\begg(s)?\b/i) && !(itemDescriptor.includes("eggplant") || itemDescriptor.includes("egg plant"))) { 
        estimatedGrams = numericPart * 50; 
        notes.push(`Parsed ${numericPart} egg(s), estimated ~${(estimatedGrams).toFixed(1)}g.`);
        unit = "egg(s)"; // Set unit for clarity
      }
      else if (itemDescriptor.includes("potato") && (remainingText.includes("small") || ingredientName.includes("small potato"))) estimatedGrams = numericPart * 100;
      else if (itemDescriptor.includes("potato")) estimatedGrams = numericPart * 170; 
      else if (numericPart === 1 && remainingText === "") { // Fallback for single count items like "1 Onion"
        if (ingredientName.includes("onion")){
            estimatedGrams = numericPart * GRAMS_PER_ONION;
            notes.push(`Parsed ${numericPart} onion(s), estimated ~${(GRAMS_PER_ONION).toFixed(1)}g.`);
            unit = "onion(s)";
        }
        // Add other single count items here if needed
        else notes.push(`Parsed as 1 count of '${ingredientName}', gram estimation ambiguous without specific item type for count.`);
      }
      else notes.push(`Count-based measure for \'${ingredientName}\' (\'${measureText}\') is ambiguous or not yet specifically handled.`);

      // if(estimatedGrams) notes.push(`Parsed count ${numericPart} of ${itemDescriptor}, estimated ~${estimatedGrams.toFixed(1)}g.`);
      // The above line is removed as specific notes are added in each block now.
      // Add a general note if a count was parsed but no specific rule hit, and it wasn't deemed ambiguous before.
      if (estimatedGrams === null && unit === "count" && !notes.some(n => n.includes("ambiguous") || n.includes("Parsed"))) {
          notes.push(`Parsed as ${numericPart} count of \'${itemDescriptor}\' for \'${ingredientName}\', but gram conversion not defined for this item.`);
      }
  }
  else if (remainingText.match(/^(sprinkle|sprinking|pinch|dash|to taste|a bit|generous portion|some)/)) {
    unit = remainingText;
    estimatedGrams = 2; 
    notes.push(`Parsed descriptive measure \'${measureText}\', assumed ~${estimatedGrams}g.`);
  }

  // Add Liters before ml to avoid conflict if "l" is part of "ml"
  else if (remainingText.match(/^l(iter(s)?)?$/) && quantity) {
    estimatedGrams = numericPart * 1000; // 1L = 1000ml, assume 1g/ml for density
    unit = "L";
    notes.push(`Parsed ${numericPart}L, converted to ~${estimatedGrams.toFixed(0)}g (assuming 1g/ml density).`);
  }
  else if (remainingText.match(/^ml|millilitre(s)?|milliliter(s)?$/) && quantity) {
    estimatedGrams = numericPart; 
    unit = "ml";
    notes.push(`Parsed ${numericPart}ml, assuming ~${estimatedGrams}g (1g/ml density default).`);
  }

  if (estimatedGrams === null && !notes.some(n => n.includes("Could not parse measure"))) {
    notes.push(`Could not parse measure \'${measureText}\' for ingredient \'${ingredientName}\' to grams. No matching unit or rule.`);
  }

  return { quantity, unit, estimatedGrams, parseNotes: notes };
}

// Define and EXPORT the application state interface
export interface AppState {
  userId: string;
}

// Define and EXPORT the params interfaces for each route
export interface RecipeIdParams extends Record<string | number, string | undefined> {
  id: string;
}

export interface CategoryParams extends Record<string | number, string | undefined> {
  categoryName: string;
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
export async function getRecipeByIdHandler(ctx: RouterContext<"/:id", RecipeIdParams, AppState>) {
  try {
    const id = ctx.params.id;
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Missing recipe ID" };
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
export async function estimateRecipeCaloriesHandler(ctx: RouterContext<"/:id/estimate-calories", RecipeIdParams, AppState>) {
  const recipeId = ctx.params.id;
  try {
    const userId = ctx.state.userId;
    if (!recipeId) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Missing recipe ID" };
      return;
    }
    console.log(`Attempting to estimate calories for recipe ID: ${recipeId} by User ID: ${userId}`);
    
    const meal: MealDbFullMeal | null = await getMealById(recipeId);
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
      parsedMeasureInfo?: ParsedMeasure; 
      calculatedCalories?: number;      
      usdaFoodMatch?: string; 
      originalSearchTerm?: string; // Added to track if search term was modified
      error?: string;
    };
    const ingredientProcessingDetails: IngredientDetail[] = [];

    // --- Step 3b: Extract Ingredients and Measures ---
    console.log("Extracting ingredients and measures...");
    for (let i = 1; i <= 20; i++) {
      const ingredientKey = `strIngredient${i}` as keyof MealDbFullMeal;
      const measureKey = `strMeasure${i}` as keyof MealDbFullMeal;
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
        
        // --- Refine Search Term --- 
        let searchTerm = item.ingredient;
        const lowerIngredient = item.ingredient.toLowerCase();

        if (lowerIngredient === "plain flour") {
          searchTerm = "Flour, all-purpose";
        } else if (lowerIngredient.includes("garlic clove")) {
          searchTerm = "Garlic, raw";
        } else if (lowerIngredient === "gruyère" || lowerIngredient === "gruyere") {
          searchTerm = "Cheese, Gruyere";
        } else if (lowerIngredient === "butter") {
          searchTerm = "Butter, salted";
        } else if (lowerIngredient === "bread" && !item.ingredient.match(/bread crumbs|breadcrumbs/i)) {
          searchTerm = "Bread, white";
        } else if (lowerIngredient === "flour") {
            searchTerm = "Flour, all-purpose"; 
        } else if (lowerIngredient === "egg") {
            searchTerm = "Egg, whole, raw";
        } else if (lowerIngredient === "egg plants" || lowerIngredient === "eggplant") { 
            searchTerm = "Eggplant, raw"; // Changed to be more specific
        } else if (lowerIngredient === "red pepper flakes") {
            searchTerm = "Crushed red pepper";
        } else if (lowerIngredient === "salt") {
            searchTerm = "Salt, table";
        } else if (lowerIngredient === "milk") {
            searchTerm = "Milk, whole";
        }

        if (searchTerm !== item.ingredient) {
          item.originalSearchTerm = item.ingredient;
        }
        // --- End Refine Search Term ---

        const searchResult = await searchFoods(searchTerm, 1, 5); 
        if (!searchResult || searchResult.foods.length === 0) {
          item.status = "usda_not_found"; 
          item.error = `No USDA food match found for ingredient: '${item.ingredient}' (searched as '${searchTerm}').`;
          return;
        }
        
        // --- Enhanced Food Selection Logic ---
        let matchedFood = null;
        // Priority 1: Survey (FNDDS)
        matchedFood = searchResult.foods.find(food => food.dataType === "Survey (FNDDS)");
        
        // Priority 2: SR Legacy
        if (!matchedFood) {
          matchedFood = searchResult.foods.find(food => food.dataType === "SR Legacy");
        }

        // Priority 3: Foundation Foods (can also be good generic entries)
        if (!matchedFood) {
            matchedFood = searchResult.foods.find(food => food.dataType === "Foundation");
        }
        
        // Fallback: First result if no preferred types found
        if (!matchedFood) {
          matchedFood = searchResult.foods[0]; 
        }
        // --- End of Enhanced Food Selection Logic ---

        if (!matchedFood) { // Should not happen if searchResult.foods has items, but as a safeguard
            item.status = "usda_not_found";
            item.error = `Logical error: No food item could be selected from USDA results for: ${item.ingredient}`;
            return;
        }

        item.fdcId = matchedFood.fdcId;
        item.usdaFoodMatch = matchedFood.description; // Store the description
        item.status = "usda_matched";
        // Add original search term to log if it was changed
        const searchLog = item.originalSearchTerm ? `(originally \"${item.originalSearchTerm}\") ` : ``;
        console.log(` -> USDA Matched for \"${searchTerm}\" ${searchLog}: \"${item.usdaFoodMatch}\" (Type: ${matchedFood.dataType}, FDC ID: ${item.fdcId})`);

        const foodDetails = await getFoodDetails(matchedFood.fdcId);
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

        // SPECIAL HANDLING FOR WATER
        if (item.ingredient.toLowerCase() === "water") {
            const originalCalories = item.caloriesPer100g;
            item.caloriesPer100g = 0; // Override to 0
            if (item.parsedMeasureInfo.estimatedGrams !== null) {
                item.calculatedCalories = 0; // Water contributes 0 calories
                item.status = "calculated_override_water"; // New status to indicate override

                if (!item.parsedMeasureInfo.parseNotes) item.parsedMeasureInfo.parseNotes = []; // Ensure array exists
                if (originalCalories !== undefined && originalCalories > 0) {
                    item.parsedMeasureInfo.parseNotes.push(`Water: Calories overridden to 0 (USDA may have shown ${originalCalories.toFixed(0)} kcal/100g for a specific water type).`);
                } else {
                    item.parsedMeasureInfo.parseNotes.push("Water: Assumed 0 calories.");
                }
            } else {
                if (!item.parsedMeasureInfo.parseNotes) item.parsedMeasureInfo.parseNotes = []; // Ensure array exists
                 item.parsedMeasureInfo.parseNotes.push("Water: Assumed 0 calories, but measure could not be estimated.");
                 // Keep status as is, likely will become measure_parse_failed if not already
            }
        }
        // SPECIAL HANDLING FOR SALT
        else if (item.ingredient.toLowerCase() === "salt") {
            const originalCalories = item.caloriesPer100g;
            item.caloriesPer100g = 0; // Override to 0
            if (item.parsedMeasureInfo.estimatedGrams !== null) {
                item.calculatedCalories = 0; // Salt contributes 0 calories
                item.status = "calculated_override_salt"; // New status for salt override

                if (!item.parsedMeasureInfo.parseNotes) item.parsedMeasureInfo.parseNotes = [];
                if (originalCalories !== undefined && originalCalories > 0) {
                    item.parsedMeasureInfo.parseNotes.push(`Salt: Calories overridden to 0 (USDA match '${item.usdaFoodMatch || 'N/A'}' might have shown ${originalCalories.toFixed(0)} kcal/100g).`);
                } else {
                    item.parsedMeasureInfo.parseNotes.push("Salt: Assumed 0 calories.");
                }
            } else {
                if (!item.parsedMeasureInfo.parseNotes) item.parsedMeasureInfo.parseNotes = [];
                 item.parsedMeasureInfo.parseNotes.push("Salt: Assumed 0 calories, but measure could not be estimated.");
            }
        }

        // Calculate calories if not overridden for water or salt and inputs are valid
        if (item.status === "calculated_override_water") {
             console.log(` -> ${item.ingredient} (Water Override): ${item.parsedMeasureInfo.estimatedGrams !== null ? item.parsedMeasureInfo.estimatedGrams + 'g' : 'Unknown grams'}, 0kcal/100g = 0kcal. Notes: ${item.parsedMeasureInfo.parseNotes.join(' ')}`);
        }
        else if (item.status === "calculated_override_salt") {
            console.log(` -> ${item.ingredient} (Salt Override): ${item.parsedMeasureInfo.estimatedGrams !== null ? item.parsedMeasureInfo.estimatedGrams + 'g' : 'Unknown grams'}, 0kcal/100g = 0kcal. Notes: ${item.parsedMeasureInfo.parseNotes.join(' ')}`);
        }
         else if (item.parsedMeasureInfo.estimatedGrams !== null && item.caloriesPer100g !== undefined) {
          item.calculatedCalories = (item.parsedMeasureInfo.estimatedGrams / 100) * item.caloriesPer100g;
          item.status = "calculated";
          console.log(` -> ${item.ingredient}: ${item.parsedMeasureInfo.estimatedGrams}g, ${item.caloriesPer100g}kcal/100g = ${item.calculatedCalories.toFixed(0)}kcal. Notes: ${item.parsedMeasureInfo.parseNotes.join(' ')}`);
        } else { // Covers non-water cases where grams is null OR kcal/100g is undefined (and not an earlier USDA status error)
            // Ensure status reflects the failure if not already set by a more specific USDA lookup error
            if (item.status === "nutrition_found" || item.status === "pending" || item.status === "usda_matched") {
                item.status = "calc_input_error"; // Calculation input error (missing grams or kcal/100g after USDA match)
            }

            let errorSummary = "";
            if (item.parsedMeasureInfo.estimatedGrams === null) {
                errorSummary += "Failed to convert measure to grams. ";
            }
            // Check for missing caloriesPer100g only if not already caught by specific USDA error statuses
            if (item.caloriesPer100g === undefined && 
                (item.status !== "usda_not_found" && item.status !== "usda_details_error" && item.status !== "calories_not_found")) {
                errorSummary += "Calorie data per 100g from USDA is missing or invalid. ";
            }
            // Ensure parseNotes exists before trying to join
            const notesString = item.parsedMeasureInfo?.parseNotes ? item.parsedMeasureInfo.parseNotes.join(' ') : 'No parsing notes.';
            item.error = `${errorSummary}Notes: ${notesString}`;
            // In the error logging for calc_input_error or measure_parse_failed, if item.originalSearchTerm exists, include it.
            // Example for the console.warn at the end of the calculation block:
            const errorSearchTermInfo = item.originalSearchTerm ? `(search was for '${searchTerm}' from original '${item.originalSearchTerm}')` : `(search was for '${searchTerm}')`;
            console.warn(` -> Calculation failed for ${item.ingredient} ${errorSearchTermInfo}. Status: ${item.status}. Measure: "${item.measure}". Error: ${item.error}`);
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

/**
 * Handles requests to get recipes by category name.
 * Expects 'categoryName' as a route parameter.
 */
export async function getRecipesByCategoryHandler(ctx: RouterContext<"/category/:categoryName", CategoryParams, AppState>) {
  try {
    const categoryName = ctx.params.categoryName;
    if (!categoryName) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Missing category name" };
      return;
    }

    console.log(`RecipeController: Fetching recipes for category: ${categoryName}`);
    // Call the service function from theMealDbApi.ts
    const mealSummaries = await filterMealsByCategoryService(categoryName);

    if (!mealSummaries) {
      // This means TheMealDB returned {"meals": null} for that category
      console.log(`RecipeController: No meals found for category "${categoryName}" from TheMealDB.`);
      ctx.response.status = 200; // Successful request, just no data for that category
      ctx.response.body = {
        success: true,
        data: [], // Return an empty array
        message: `No meals found for category: ${categoryName}`,
      };
      return;
    }

    // TheMealDB's filter.php returns idMeal, strMeal, strMealThumb.
    // Let's map these to a structure that might be more consistent for your frontend,
    // similar to your existing Recipe interface, but simplified for summaries.
    // Or, you can just return mealSummaries as is.
    // For now, let's return them as is. The frontend will adapt.
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: mealSummaries, // mealSummaries is an array of { idMeal, strMeal, strMealThumb }
    };

  } catch (error) {
    console.error(`Error in getRecipesByCategoryHandler for category ${ctx.params.categoryName}:`, error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error fetching recipes by category.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles requests to get featured recipes.
 */
export async function getFeaturedRecipesHandler(ctx: Context) {
  try {
    console.log("RecipeController: Reached getFeaturedRecipesHandler"); 
    const recipes = await getFeaturedRecipesService(); 
    if (recipes) {
      console.log(`RecipeController: getFeaturedRecipesHandler found ${recipes.length} recipes.`);
    } else {
      console.log("RecipeController: getFeaturedRecipesHandler found no recipes (null).");
    }
    ctx.response.status = 200;
    ctx.response.body = { success: true, data: recipes || [] }; 
  } catch (error) {
    console.error("Error in getFeaturedRecipesHandler:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error fetching featured recipes.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Add more handlers here later for listCategories, filterByCategory etc.
// export async function listCategoriesHandler(ctx: Context) { ... }
// export async function filterRecipesByCategoryHandler(ctx: Context) { ... }