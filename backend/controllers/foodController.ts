import { RouterContext } from "../deps.ts"; // Changed Context to RouterContext
import {
  searchFoodNutrition,
  getFoodNutritionById,
  NutritionData, // Assuming this is exported from nutritionService.ts
} from "../services/nutritionService.ts"; // Your existing service
import dbClient from "../services/db.ts"; // Import the database client

// Interface for simplified autocomplete suggestions
interface AutocompleteSuggestion {
  id: string;       // FatSecret food_id
  name: string;
  brandName?: string;
  servingSize: string; // Reference serving size description
}

// Define a more specific context type if needed, or use type assertions carefully
// For example, if your auth middleware adds userId to state:
interface AppState {
  userId?: string;
  // other state properties
}

// --- New Interfaces for Food Logging ---
interface CreateFoodLogEntryPayload {
  fatsecret_food_id: string;
  fatsecret_serving_id: string;
  reference_serving_description: string;
  base_calories: number;
  base_protein: number;
  base_fat: number;
  base_carbs: number;
  food_name: string;
  logged_quantity: number;
  meal_type: string;
  log_date: string;
  notes?: string;
}

interface FoodLogEntrySchema {
  log_entry_id: number;
  user_id: string;
  log_date: string; // Or Date, depending on how your DB client returns it
  meal_type: string;
  fatsecret_food_id: string;
  fatsecret_serving_id: string;
  logged_serving_description: string;
  logged_quantity: number;
  calories_consumed: number;
  protein_consumed: number;
  fat_consumed: number;
  carbs_consumed: number;
  food_name?: string | null;
  notes?: string | null;
  created_at: string; // Or Date
  updated_at: string; // Or Date
}
// --- End New Interfaces ---

/**
 * Handles GET /api/fatsecret/foods/search
 * Requires authMiddleware.
 * Extracts 'query' from ctx.request.url.searchParams.
 * Calls searchFoodNutrition(query, ...) from nutritionService.ts.
 * Responds with { success: true, data: NutritionData[] } or an error.
 */
export async function handleFoodSearch(ctx: RouterContext<string, any, AppState>) {
  try {
    const userId = ctx.state.userId; // Access userId from AppState
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "User not authenticated." };
      return;
    }

    const query = ctx.request.url.searchParams.get("query");
    if (!query) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Search query parameter is required." };
      return;
    }

    // You might want to make max_results configurable via query param too
    const maxResultsParam = ctx.request.url.searchParams.get("max_results");
    const maxResults = maxResultsParam ? parseInt(maxResultsParam, 10) : 10; // Default to 10 results

    const foodResults: NutritionData[] = await searchFoodNutrition(query, maxResults);

    ctx.response.status = 200;
    ctx.response.body = { success: true, data: foodResults };

  } catch (error) {
    console.error("Error in handleFoodSearch:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error searching for food.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles GET /api/fatsecret/foods/:foodId
 * Requires authMiddleware.
 * Extracts foodId from ctx.params.
 * Calls getFoodNutritionById(foodId) from nutritionService.ts.
 * Responds with { success: true, data: NutritionData | null }.
 */
export async function handleGetFoodDetails(
  ctx: RouterContext<string, { foodId: string }, AppState>
) {
  try {
    const userId = ctx.state.userId; // Access userId from AppState
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "User not authenticated." };
      return;
    }

    // Oak router populates ctx.params based on the route definition
    const foodId = ctx.params.foodId;
    if (!foodId) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Food ID parameter is required." };
      return;
    }

    const foodDetails: NutritionData | null = await getFoodNutritionById(foodId);

    if (!foodDetails) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, message: `Food with ID ${foodId} not found.` };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { success: true, data: foodDetails };

  } catch (error) {
    console.error("Error in handleGetFoodDetails:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error retrieving food details.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * (Optional but Recommended for UX later)
 * Handles GET /api/fatsecret/foods/autocomplete
 * Requires authMiddleware.
 * Extracts 'expression' from ctx.request.url.searchParams.
 * Calls searchFoodNutrition(expression, 5) (or a similar small max_results).
 * Transforms the full NutritionData[] into a simpler array like
 * [{ id: string, name: string, brandName?: string, servingSize: string }] suitable for autocomplete suggestions.
 * Responds with { success: true, data: AutocompleteSuggestion[] }.
 */
export async function handleFoodAutocomplete(ctx: RouterContext<string, any, AppState>) {
   try {
    const userId = ctx.state.userId; // Access userId from AppState
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "User not authenticated." };
      return;
    }

    const expression = ctx.request.url.searchParams.get("expression");
    if (!expression) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Autocomplete expression parameter is required." };
      return;
    }

    const maxResults = 5; // Keep autocomplete results small
    const foodResults: NutritionData[] = await searchFoodNutrition(expression, maxResults);

    const suggestions: AutocompleteSuggestion[] = foodResults.map(food => ({
        id: food.id,
        name: food.name,
        brandName: food.brandName,
        servingSize: food.servingSize, // The reference serving size
    }));

    ctx.response.status = 200;
    ctx.response.body = { success: true, data: suggestions };

  } catch (error) {
    console.error("Error in handleFoodAutocomplete:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error during food autocomplete search.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles POST /api/food-logs
 * Protected by authMiddleware (access ctx.state.userId).
 * Expects a JSON body from the frontend.
 * Calculates derived nutritional values.
 * Inserts the log entry into the food_log_entries table.
 * Returns the newly created log entry or a success message.
 */
export async function createFoodLogEntryHandler(ctx: RouterContext<string, any, AppState>) {
  try {
    const userId = ctx.state.userId;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "User not authenticated." };
      return;
    }

    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Request body is missing." };
      return;
    }

    const body = ctx.request.body({ type: "json" });
    const payload = (await body.value) as CreateFoodLogEntryPayload;

    // --- Basic Payload Validation ---
    const requiredFields: (keyof CreateFoodLogEntryPayload)[] = [
      "fatsecret_food_id", "fatsecret_serving_id", "reference_serving_description",
      "base_calories", "base_protein", "base_fat", "base_carbs",
      "food_name",
      "logged_quantity", "meal_type", "log_date",
    ];

    for (const field of requiredFields) {
      if (payload[field] === undefined || payload[field] === null) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: `Missing required field: ${field}` };
        return;
      }
    }
    if (typeof payload.logged_quantity !== 'number' || payload.logged_quantity <= 0) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: "logged_quantity must be a positive number." };
        return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.log_date)) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: "log_date must be in YYYY-MM-DD format." };
        return;
    }
    // --- End Validation ---

    // Calculate derived nutritional values
    const calories_consumed = payload.base_calories * payload.logged_quantity;
    const protein_consumed = payload.base_protein * payload.logged_quantity;
    const fat_consumed = payload.base_fat * payload.logged_quantity;
    const carbs_consumed = payload.base_carbs * payload.logged_quantity;

    // --- Insert into Database ---
    const insertQuery = `
      INSERT INTO public.food_log_entries (
        user_id, log_date, meal_type,
        fatsecret_food_id, fatsecret_serving_id,
        logged_serving_description, logged_quantity,
        calories_consumed, protein_consumed, fat_consumed, carbs_consumed,
        notes, food_name
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING log_entry_id, user_id, log_date, meal_type, fatsecret_food_id, fatsecret_serving_id,
                logged_serving_description, logged_quantity, calories_consumed, protein_consumed,
                fat_consumed, carbs_consumed, notes, food_name, created_at, updated_at;
    `;

    const result = await dbClient.queryObject<FoodLogEntrySchema>(insertQuery, [
      userId,
      payload.log_date,
      payload.meal_type,
      payload.fatsecret_food_id,
      payload.fatsecret_serving_id,
      payload.reference_serving_description,
      payload.logged_quantity,
      calories_consumed,
      protein_consumed,
      fat_consumed,
      carbs_consumed,
      payload.notes || null,
      payload.food_name,
    ]);

    if (result.rows.length === 0) {
      ctx.response.status = 500;
      ctx.response.body = { success: false, message: "Failed to create food log entry or retrieve created entry." };
      return;
    }

    const newLogEntry = result.rows[0];

    ctx.response.status = 201; // Created
    ctx.response.body = {
      success: true,
      message: "Food log entry created successfully.",
      data: newLogEntry,
    };

  } catch (error) {
    console.error("Error in createFoodLogEntryHandler:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error creating food log entry.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles GET /api/food-logs
 * Protected by authMiddleware.
 * Accepts a 'date' query parameter (YYYY-MM-DD). If no date, defaults to today.
 * Fetches all food_log_entries for ctx.state.userId and the given date.
 * Orders results (e.g., by meal_type then created_at).
 * Returns { success: true, data: FoodLogEntrySchema[] }.
 */
export async function getFoodLogEntriesHandler(ctx: RouterContext<string, any, AppState>) { // Using RouterContext
  try {
    const userId = ctx.state.userId;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "User not authenticated." };
      return;
    }

    let targetDate = ctx.request.url.searchParams.get("date");

    // Validate or default the date
    if (targetDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: "Invalid date format. Please use YYYY-MM-DD." };
        return;
      }
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      targetDate = `${year}-${month}-${day}`;
    }

    const selectQuery = `
      SELECT 
        log_entry_id, user_id, log_date, meal_type, 
        fatsecret_food_id, fatsecret_serving_id, 
        logged_serving_description, logged_quantity,
        calories_consumed, protein_consumed, fat_consumed, carbs_consumed,
        notes, food_name,
        created_at, updated_at
      FROM public.food_log_entries
      WHERE user_id = $1 AND log_date = $2
      ORDER BY 
        CASE meal_type
          WHEN 'breakfast' THEN 1
          WHEN 'lunch' THEN 2
          WHEN 'dinner' THEN 3
          WHEN 'snack' THEN 4
          ELSE 5
        END, 
        created_at ASC;
    `;

    const result = await dbClient.queryObject<FoodLogEntrySchema>(selectQuery, [
      userId,
      targetDate,
    ]);

    const logEntries = result.rows;

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: logEntries,
    };

  } catch (error) {
    console.error("Error in getFoodLogEntriesHandler:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error retrieving food log entries.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles DELETE /api/food-logs/:logEntryId
 * Protected by authMiddleware.
 * Extracts logEntryId from ctx.params.
 * Verifies that the logEntryId belongs to the ctx.state.userId before deleting.
 * Deletes the entry from food_log_entries.
 * Returns a success message.
 */
export async function deleteFoodLogEntryHandler(ctx: RouterContext<string, { logEntryId: string }, AppState>) { // Using RouterContext
  try {
    const userId = ctx.state.userId;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "User not authenticated." };
      return;
    }

    const logEntryIdParam = ctx.params.logEntryId; // From the route path /:logEntryId
    if (!logEntryIdParam) {
      // This case should ideally be caught by router if param is defined in route string
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Log entry ID parameter is required." };
      return;
    }

    const logEntryId = parseInt(logEntryIdParam, 10);
    if (isNaN(logEntryId)) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: "Invalid log entry ID format. Must be a number." };
        return;
    }

    // --- Delete from Database ---
    const deleteQuery = `
      DELETE FROM public.food_log_entries
      WHERE log_entry_id = $1 AND user_id = $2
      RETURNING log_entry_id;
    `;

    const result = await dbClient.queryObject<{log_entry_id: number}>(deleteQuery, [
      logEntryId,
      userId,
    ]);

    if (result.rowCount === 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: `Food log entry with ID ${logEntryId} not found or user not authorized to delete.`,
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: `Food log entry with ID ${logEntryId} deleted successfully.`,
    };

  } catch (error) {
    console.error("Error in deleteFoodLogEntryHandler:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error deleting food log entry.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
