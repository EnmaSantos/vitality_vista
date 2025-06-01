// backend/controllers/workoutController.ts

import { Context } from "../deps.ts"; // Import Oak Context
import dbClient from "../services/db.ts"; // Import the database client
import { WorkoutPlanSchema } from "../models/workoutPlan.model.ts"; // Import the model interface
import { PlanExerciseSchema } from "../models/planExercise.model.ts"; // Import the plan exercise model

// Interface for the expected request body when creating a plan
interface CreateWorkoutPlanPayload {
  name: string;
  description?: string; // Optional description
}

// Interface for adding an exercise to a workout plan
interface AddExerciseToPlanPayload {
  exercise_id: number;
  exercise_name: string;
  sets?: number;
  reps?: string;
  weight_kg?: number;
  duration_minutes?: number;
  rest_period_seconds?: number;
  notes?: string;
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
    ctx.response.body = newPlan; // Return the newPlan object directly

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

// --- NEW Handler Function ---

/**
 * Handles requests to get all workout plans for the authenticated user.
 */
export async function getUserWorkoutPlansHandler(ctx: Context) {
  try {
    // 1. Get Authenticated User ID
    const userId = ctx.state.userId as string | undefined;

    if (!userId) {
      ctx.response.status = 401; // Unauthorized
      ctx.response.body = { success: false, message: "User not authenticated" };
      console.error("Error: userId missing from context state in getUserWorkoutPlansHandler");
      return;
    }

    // 2. Fetch plans from Database
    const selectQuery = `
      SELECT plan_id, user_id, name, description, created_at, updated_at
      FROM workout_plans
      WHERE user_id = $1
      ORDER BY updated_at DESC; -- Order by most recently updated
    `;

    const result = await dbClient.queryObject<WorkoutPlanSchema>(
        selectQuery,
        [userId]
    );

    const userPlans = result.rows; // Get the array of plans

    // 3. Send Response
    ctx.response.status = 200; // OK
    ctx.response.body = userPlans; // Return the array of plans directly

  } catch (error) {
    console.error("Error in getUserWorkoutPlansHandler:", error);
    ctx.response.status = 500; // Internal Server Error
    ctx.response.body = {
      success: false,
      message: "Server error retrieving workout plans",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles requests to add an exercise to a specific workout plan.
 * POST /api/workout-plans/:planId/exercises
 */
export async function addExerciseToPlanHandler(ctx: Context) {
  try {
    // 1. Get Authenticated User ID
    const userId = ctx.state.userId as string | undefined;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "User not authenticated" };
      console.error("Error: userId missing from context state in addExerciseToPlanHandler");
      return;
    }

    // 2. Get plan ID from URL parameters
    const planId = parseInt(ctx.params.planId);
    if (isNaN(planId)) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Invalid plan ID" };
      return;
    }

    // 3. Verify the plan belongs to the user
    const planCheckQuery = `
      SELECT plan_id FROM workout_plans 
      WHERE plan_id = $1 AND user_id = $2
    `;
    const planCheckResult = await dbClient.queryObject(planCheckQuery, [planId, userId]);
    
    if (planCheckResult.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, message: "Workout plan not found or access denied" };
      return;
    }

    // 4. Get Request Body
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Request body is missing" };
      return;
    }

    const body = ctx.request.body({ type: 'json' });
    const payload = await body.value as AddExerciseToPlanPayload;

    // 5. Basic Validation
    if (!payload.exercise_id || typeof payload.exercise_id !== 'number') {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "exercise_id is required and must be a number" };
      return;
    }
    if (!payload.exercise_name || typeof payload.exercise_name !== 'string' || payload.exercise_name.trim() === '') {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "exercise_name is required and must be a non-empty string" };
      return;
    }

    // 6. Get the next order for this plan
    const orderQuery = `
      SELECT COALESCE(MAX(order_in_plan), 0) + 1 as next_order
      FROM plan_exercises 
      WHERE plan_id = $1
    `;
    const orderResult = await dbClient.queryObject<{ next_order: number }>(orderQuery, [planId]);
    const nextOrder = orderResult.rows[0]?.next_order || 1;

    // 7. Insert the exercise into the plan
    const insertQuery = `
      INSERT INTO plan_exercises (
        plan_id, exercise_id, exercise_name, order_in_plan,
        sets, reps, weight_kg, duration_minutes, rest_period_seconds, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING plan_exercise_id, plan_id, exercise_id, exercise_name, order_in_plan,
                sets, reps, weight_kg, duration_minutes, rest_period_seconds, notes;
    `;

    const result = await dbClient.queryObject<PlanExerciseSchema>(insertQuery, [
      planId,
      payload.exercise_id,
      payload.exercise_name.trim(),
      nextOrder,
      payload.sets || null,
      payload.reps || null,
      payload.weight_kg || null,
      payload.duration_minutes || null,
      payload.rest_period_seconds || null,
      payload.notes?.trim() || null,
    ]);

    const newPlanExercise = result.rows[0];

    // 8. Update the workout plan's updated_at timestamp
    await dbClient.queryObject(
      `UPDATE workout_plans SET updated_at = CURRENT_TIMESTAMP WHERE plan_id = $1`,
      [planId]
    );

    // 9. Send Response
    ctx.response.status = 201;
    ctx.response.body = newPlanExercise; // Return the newPlanExercise object directly

  } catch (error) {
    console.error("Error in addExerciseToPlanHandler:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error adding exercise to plan",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// --- TODO: Add handlers for other workout management actions ---
// export async function getWorkoutPlanByIdHandler(ctx: Context) { ... }
// export async function updateWorkoutPlanHandler(ctx: Context) { ... }
// export async function deleteWorkoutPlanHandler(ctx: Context) { ... }
// export async function createWorkoutLogHandler(ctx: Context) { ... }
// ... etc ...