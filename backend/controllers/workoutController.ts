// backend/controllers/workoutController.ts

import { Context } from "../deps.ts"; // Import Oak Context
import dbClient from "../services/db.ts"; // Import the database client
import { WorkoutPlanSchema } from "../models/workoutPlan.model.ts"; // Import the model interface

// Interface for the expected request body when creating a plan
interface CreateWorkoutPlanPayload {
  name: string;
  description?: string; // Optional description
}

/**
 * Handles requests to create a new workout plan for the authenticated user.
 */
export async function createWorkoutPlanHandler(ctx: Context) {
  try {
    // 1. Get Authenticated User ID (Assumes authMiddleware runs before this)
    //    authMiddleware should place userId in ctx.state
    const userId = ctx.state.userId as string | undefined;

    if (!userId) {
      ctx.response.status = 401; // Unauthorized
      ctx.response.body = { success: false, message: "User not authenticated" };
      console.error("Error: userId missing from context state in createWorkoutPlanHandler");
      return;
    }

    // 2. Get Request Body
    if (!ctx.request.hasBody) {
        ctx.response.status = 400; // Bad Request
        ctx.response.body = { success: false, message: "Request body is missing" };
        return;
    }
    const body = ctx.request.body({ type: 'json' });
    const value = await body.value as CreateWorkoutPlanPayload;

    // 3. Basic Validation
    if (!value.name || typeof value.name !== 'string' || value.name.trim() === '') {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: "Plan 'name' is required and must be a non-empty string" };
        return;
    }
    if (value.description && typeof value.description !== 'string') {
         ctx.response.status = 400;
         ctx.response.body = { success: false, message: "Plan 'description' must be a string" };
         return;
    }

    // 4. Insert into Database
    const insertQuery = `
      INSERT INTO workout_plans (user_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING plan_id, user_id, name, description, created_at, updated_at;
    `; // RETURNING * gets the full new row

    const result = await dbClient.queryObject<WorkoutPlanSchema>(
        insertQuery,
        [userId, value.name.trim(), value.description?.trim() || null] // Use null if description is empty/missing
    );

    const newPlan = result.rows[0]; // Get the newly created plan record

    // 5. Send Response
    ctx.response.status = 201; // Created
    ctx.response.body = {
      success: true,
      message: "Workout plan created successfully",
      data: newPlan,
    };

  } catch (error) {
    console.error("Error in createWorkoutPlanHandler:", error);
    // Check for specific DB errors if needed (e.g., unique constraints)
    ctx.response.status = 500; // Internal Server Error
    ctx.response.body = {
      success: false,
      message: "Server error creating workout plan",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// --- TODO: Add handlers for other workout management actions ---
// export async function getUserWorkoutPlansHandler(ctx: Context) { ... }
// export async function getWorkoutPlanByIdHandler(ctx: Context) { ... }
// export async function updateWorkoutPlanHandler(ctx: Context) { ... }
// export async function deleteWorkoutPlanHandler(ctx: Context) { ... }
// export async function addExerciseToPlanHandler(ctx: Context) { ... }
// export async function createWorkoutLogHandler(ctx: Context) { ... }
// ... etc ...