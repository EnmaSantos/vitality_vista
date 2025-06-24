// backend/controllers/workoutController.ts

import { RouterContext } from "../deps.ts"; // Import Oak RouterContext for route params
import dbClient, { ensureConnection } from "../services/db.ts"; // Import the database client
import { WorkoutPlanSchema } from "../models/workoutPlan.model.ts"; // Import the model interface
import { PlanExerciseSchema } from "../models/planExercise.model.ts"; // Import the plan exercise model
import { WorkoutLogSchema } from "../models/workoutLog.model.ts"; // Import the workout log model
import { LogExerciseDetailSchema } from "../models/logExerciseDetail.model.ts"; // Import the log exercise detail model

// Consistent API Response Format
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request/Response DTOs
interface CreateWorkoutPlanRequest {
  name: string;
  description?: string;
}

interface AddExerciseToPlanRequest {
  exercise_id: number;
  exercise_name: string;
  sets?: number;
  reps?: string;
  weight_kg?: number;
  duration_minutes?: number;
  rest_period_seconds?: number;
  notes?: string;
}

// New DTO for updating a plan exercise
interface UpdatePlanExerciseRequest {
  sets?: number;
  reps?: string;
  weight_kg?: number;
  duration_minutes?: number;
  rest_period_seconds?: number;
  notes?: string;
  order_in_plan?: number; // Optional: if we want to allow reordering later
}

/**
 * Creates a new workout plan for the authenticated user
 */
export async function createWorkoutPlanHandler(ctx: RouterContext) {
  const response: ApiResponse<WorkoutPlanSchema> = { success: false };
  
  try {
    // Ensure database connection is alive
    await ensureConnection();
    
    // 1. Validate authentication
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }

    // 2. Parse and validate request body
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      response.error = "Request body is required";
      ctx.response.body = response;
      return;
    }

    const body = ctx.request.body({ type: 'json' });
    const payload = await body.value as CreateWorkoutPlanRequest;

    // 3. Validate required fields
    if (!payload.name || payload.name.trim().length === 0) {
      ctx.response.status = 400;
      response.error = "Plan name is required";
      ctx.response.body = response;
      return;
    }

    // 4. Create the workout plan
    const insertQuery = `
      INSERT INTO workout_plans (user_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING plan_id, user_id, name, description, created_at, updated_at
    `;

    const result = await dbClient.queryObject<WorkoutPlanSchema>(
      insertQuery,
      [userId, payload.name.trim(), payload.description?.trim() || null]
    );

    const newPlan = result.rows[0];
    
    if (!newPlan) {
      throw new Error("Failed to create workout plan - no data returned from database");
    }

    // Log for debugging
    console.log("Created workout plan:", {
      plan_id: newPlan.plan_id,
      plan_id_type: typeof newPlan.plan_id,
      full_plan: newPlan
    });

    // 5. Send success response
    response.success = true;
    response.data = newPlan;
    response.message = "Workout plan created successfully";
    
    ctx.response.status = 201;
    ctx.response.body = response;

  } catch (error) {
    console.error("Error in createWorkoutPlanHandler:", error);
    
    response.success = false;
    response.error = error instanceof Error ? error.message : "Unknown error occurred";
    
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

/**
 * Gets all workout plans for the authenticated user
 */
export async function getUserWorkoutPlansHandler(ctx: RouterContext) {
  const response: ApiResponse<WorkoutPlanSchema[]> = { success: false };
  
  try {
    // 1. Validate authentication
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }

    // 2. Fetch workout plans
    const selectQuery = `
      SELECT plan_id, user_id, name, description, created_at, updated_at
      FROM workout_plans
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;

    const result = await dbClient.queryObject<WorkoutPlanSchema>(
      selectQuery,
      [userId]
    );

    // 3. Send success response
    response.success = true;
    response.data = result.rows;
    response.message = `Found ${result.rows.length} workout plans`;
    
    ctx.response.status = 200;
    ctx.response.body = response;

  } catch (error) {
    console.error("Error in getUserWorkoutPlansHandler:", error);
    
    response.success = false;
    response.error = error instanceof Error ? error.message : "Unknown error occurred";
    
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

/**
 * Adds an exercise to a specific workout plan
 */
export async function addExerciseToPlanHandler(ctx: RouterContext) {
  const response: ApiResponse<PlanExerciseSchema> = { success: false };
  
  try {
    // 1. Validate authentication
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }

    // 2. Validate plan ID
    const planId = parseInt(ctx.params.planId);
    if (isNaN(planId)) {
      ctx.response.status = 400;
      response.error = "Invalid plan ID";
      ctx.response.body = response;
      return;
    }

    // 3. Verify plan ownership
    const planCheckQuery = `
      SELECT plan_id FROM workout_plans 
      WHERE plan_id = $1 AND user_id = $2
    `;
    const planCheckResult = await dbClient.queryObject(planCheckQuery, [planId, userId]);
    
    if (planCheckResult.rows.length === 0) {
      ctx.response.status = 404;
      response.error = "Workout plan not found or access denied";
      ctx.response.body = response;
      return;
    }

    // 4. Parse and validate request body
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      response.error = "Request body is required";
      ctx.response.body = response;
      return;
    }

    const body = ctx.request.body({ type: 'json' });
    const payload = await body.value as AddExerciseToPlanRequest;

    // 5. Validate required fields
    if (!payload.exercise_id || !payload.exercise_name) {
      ctx.response.status = 400;
      response.error = "Exercise ID and name are required";
      ctx.response.body = response;
      return;
    }

    // 6. Get next order number
    const orderQuery = `
      SELECT COALESCE(MAX(order_in_plan), 0) + 1 as next_order
      FROM plan_exercises 
      WHERE plan_id = $1
    `;
    const orderResult = await dbClient.queryObject<{ next_order: number }>(
      orderQuery, 
      [planId]
    );
    const nextOrder = orderResult.rows[0]?.next_order || 1;

    // 7. Insert the exercise
    const insertQuery = `
      INSERT INTO plan_exercises (
        plan_id, exercise_id, exercise_name, order_in_plan,
        sets, reps, weight_kg, duration_minutes, rest_period_seconds, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING plan_exercise_id, plan_id, exercise_id, exercise_name, order_in_plan,
                sets, reps, weight_kg, duration_minutes, rest_period_seconds, notes
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
    
    if (!newPlanExercise) {
      throw new Error("Failed to add exercise - no data returned from database");
    }

    // 8. Update workout plan timestamp
    await dbClient.queryObject(
      `UPDATE workout_plans SET updated_at = CURRENT_TIMESTAMP WHERE plan_id = $1`,
      [planId]
    );

    // 9. Send success response
    response.success = true;
    response.data = newPlanExercise;
    response.message = "Exercise added to workout plan successfully";
    
    ctx.response.status = 201;
    ctx.response.body = response;

  } catch (error) {
    console.error("Error in addExerciseToPlanHandler:", error);
    
    response.success = false;
    response.error = error instanceof Error ? error.message : "Unknown error occurred";
    
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

/**
 * Creates a new workout log (actual workout session)
 */
export async function createWorkoutLogHandler(ctx: RouterContext) {
  const response: ApiResponse<WorkoutLogSchema> = { success: false };
  
  try {
    // 1. Validate authentication
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }

    // 2. Parse request body
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      response.error = "Request body is required";
      ctx.response.body = response;
      return;
    }

    const body = ctx.request.body({ type: 'json' });
    const payload = await body.value as {
      plan_id?: number;
      duration_minutes?: number;
      notes?: string;
    };

    // 3. Create workout log
    const insertQuery = `
      INSERT INTO workout_logs (user_id, plan_id, duration_minutes, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING log_id, user_id, plan_id, log_date, duration_minutes, notes, created_at
    `;

    const result = await dbClient.queryObject<WorkoutLogSchema>(
      insertQuery,
      [userId, payload.plan_id || null, payload.duration_minutes || null, payload.notes?.trim() || null]
    );

    const newLog = result.rows[0];
    
    if (!newLog) {
      throw new Error("Failed to create workout log - no data returned from database");
    }

    // 4. Send success response
    response.success = true;
    response.data = newLog;
    response.message = "Workout log created successfully";
    
    ctx.response.status = 201;
    ctx.response.body = response;

  } catch (error) {
    console.error("Error in createWorkoutLogHandler:", error);
    
    response.success = false;
    response.error = error instanceof Error ? error.message : "Unknown error occurred";
    
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

/**
 * Logs exercise details for a workout session
 */
export async function logExerciseDetailsHandler(ctx: RouterContext) {
  const response: ApiResponse<LogExerciseDetailSchema> = { success: false };
  
  try {
    // 1. Validate authentication
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }

    // 2. Validate log ID
    const logId = parseInt(ctx.params.logId);
    if (isNaN(logId)) {
      ctx.response.status = 400;
      response.error = "Invalid log ID";
      ctx.response.body = response;
      return;
    }

    // 3. Verify log ownership
    const logCheckQuery = `
      SELECT log_id FROM workout_logs 
      WHERE log_id = $1 AND user_id = $2
    `;
    const logCheckResult = await dbClient.queryObject(logCheckQuery, [logId, userId]);
    
    if (logCheckResult.rows.length === 0) {
      ctx.response.status = 404;
      response.error = "Workout log not found or access denied";
      ctx.response.body = response;
      return;
    }

    // 4. Parse request body
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      response.error = "Request body is required";
      ctx.response.body = response;
      return;
    }

    const body = ctx.request.body({ type: 'json' });
    const payload = await body.value as {
      exercise_id: number;
      exercise_name: string;
      set_number: number;
      reps_achieved?: number;
      weight_kg_used?: number;
      duration_achieved_seconds?: number;
      notes?: string;
    };

    // 5. Validate required fields
    if (!payload.exercise_id || !payload.exercise_name || !payload.set_number) {
      ctx.response.status = 400;
      response.error = "Exercise ID, name, and set number are required";
      ctx.response.body = response;
      return;
    }

    // 6. Get next order number for this log
    const orderQuery = `
      SELECT COALESCE(MAX(order_in_log), 0) + 1 as next_order
      FROM log_exercise_details 
      WHERE log_id = $1 AND exercise_id = $2
    `;
    const orderResult = await dbClient.queryObject<{ next_order: number }>(
      orderQuery, 
      [logId, payload.exercise_id]
    );
    const nextOrder = orderResult.rows[0]?.next_order || 1;

    // 7. Insert exercise detail
    const insertQuery = `
      INSERT INTO log_exercise_details (
        log_id, exercise_id, exercise_name, order_in_log,
        set_number, reps_achieved, weight_kg_used, 
        duration_achieved_seconds, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING log_exercise_id, log_id, exercise_id, exercise_name, 
                order_in_log, set_number, reps_achieved, weight_kg_used,
                duration_achieved_seconds, notes
    `;

    const result = await dbClient.queryObject<LogExerciseDetailSchema>(insertQuery, [
      logId,
      payload.exercise_id,
      payload.exercise_name.trim(),
      nextOrder,
      payload.set_number,
      payload.reps_achieved || null,
      payload.weight_kg_used || null,
      payload.duration_achieved_seconds || null,
      payload.notes?.trim() || null,
    ]);

    const newDetail = result.rows[0];
    
    if (!newDetail) {
      throw new Error("Failed to log exercise detail - no data returned from database");
    }

    // 8. Send success response
    response.success = true;
    response.data = newDetail;
    response.message = "Exercise logged successfully";
    
    ctx.response.status = 201;
    ctx.response.body = response;

  } catch (error) {
    console.error("Error in logExerciseDetailsHandler:", error);
    
    response.success = false;
    response.error = error instanceof Error ? error.message : "Unknown error occurred";
    
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

/**
 * Gets all workout logs for the authenticated user
 */
export async function getUserWorkoutLogsHandler(ctx: RouterContext) {
  const response: ApiResponse<WorkoutLogSchema[]> = { success: false };
  
  try {
    // 1. Validate authentication
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }

    // 2. Fetch workout logs
    const selectQuery = `
      SELECT wl.log_id, wl.user_id, wl.plan_id, wl.log_date, 
             wl.duration_minutes, wl.notes, wl.created_at,
             wp.name as plan_name
      FROM workout_logs wl
      LEFT JOIN workout_plans wp ON wl.plan_id = wp.plan_id
      WHERE wl.user_id = $1
      ORDER BY wl.log_date DESC
    `;

    const result = await dbClient.queryObject<WorkoutLogSchema & { plan_name?: string }>(
      selectQuery,
      [userId]
    );

    // 3. Send success response
    response.success = true;
    response.data = result.rows;
    response.message = `Found ${result.rows.length} workout logs`;
    
    ctx.response.status = 200;
    ctx.response.body = response;

  } catch (error) {
    console.error("Error in getUserWorkoutLogsHandler:", error);
    
    response.success = false;
    response.error = error instanceof Error ? error.message : "Unknown error occurred";
    
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

/**
 * Gets exercise details for a specific workout log
 */
export async function getWorkoutLogDetailsHandler(ctx: RouterContext) {
  const response: ApiResponse<LogExerciseDetailSchema[]> = { success: false };
  
  try {
    // 1. Validate authentication
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }

    // 2. Validate log ID
    const logId = parseInt(ctx.params.logId);
    if (isNaN(logId)) {
      ctx.response.status = 400;
      response.error = "Invalid log ID";
      ctx.response.body = response;
      return;
    }

    // 3. Verify the workout log belongs to the user
    const logOwnershipQuery = `
      SELECT user_id FROM workout_logs WHERE log_id = $1
    `;
    const ownershipResult = await dbClient.queryObject<{ user_id: string }>(
      logOwnershipQuery,
      [logId]
    );

    if (ownershipResult.rows.length === 0) {
      ctx.response.status = 404;
      response.error = "Workout log not found";
      ctx.response.body = response;
      return;
    }

    if (ownershipResult.rows[0].user_id !== userId) {
      ctx.response.status = 403;
      response.error = "Access denied";
      ctx.response.body = response;
      return;
    }

    // 4. Fetch exercise details for the workout log
    const exerciseDetailsQuery = `
      SELECT log_exercise_id, log_id, exercise_id, exercise_name, order_in_log,
             set_number, reps_achieved, weight_kg_used, duration_achieved_seconds, notes
      FROM log_exercise_details
      WHERE log_id = $1
      ORDER BY order_in_log, set_number
    `;

    const result = await dbClient.queryObject<LogExerciseDetailSchema>(
      exerciseDetailsQuery,
      [logId]
    );

    // 5. Send success response
    response.success = true;
    response.data = result.rows;
    response.message = `Found ${result.rows.length} exercise details for workout log`;
    
    ctx.response.status = 200;
    ctx.response.body = response;

  } catch (error) {
    console.error("Error in getWorkoutLogDetailsHandler:", error);
    
    response.success = false;
    response.error = error instanceof Error ? error.message : "Unknown error occurred";
    
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

// --- New: Get exercises for a specific plan ---
export async function getPlanExercisesHandler(ctx: RouterContext) {
  const response: ApiResponse<PlanExerciseSchema[]> = { success: false };
  try {
    await ensureConnection();
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }

    const planId = parseInt(ctx.params.planId);
    if (isNaN(planId)) {
      ctx.response.status = 400;
      response.error = "Invalid plan ID";
      ctx.response.body = response;
      return;
    }

    // Ensure the plan belongs to the user
    const planRows = await dbClient.queryObject<{ plan_id: number }>(
      "SELECT plan_id FROM workout_plans WHERE plan_id = $1 AND user_id = $2",
      [planId, userId]
    );
    if (planRows.rows.length === 0) {
      ctx.response.status = 404;
      response.error = "Workout plan not found or access denied";
      ctx.response.body = response;
      return;
    }

    const result = await dbClient.queryObject<PlanExerciseSchema>(
      `SELECT * FROM plan_exercises WHERE plan_id = $1 ORDER BY order_in_plan`,
      [planId]
    );

    response.success = true;
    response.data = result.rows;
    ctx.response.status = 200;
    ctx.response.body = response;
  } catch (error) {
    console.error("Error in getPlanExercisesHandler:", error);
    response.error = error instanceof Error ? error.message : "Unknown error";
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

export async function deleteWorkoutPlanHandler(ctx: RouterContext) {
  console.log("[deleteWorkoutPlanHandler] Handler called");
  console.log("[deleteWorkoutPlanHandler] Plan ID from params:", ctx.params.planId);
  console.log("[deleteWorkoutPlanHandler] User ID from state:", ctx.state.userId);
  
  const response: ApiResponse = { success: false };
  try {
    await ensureConnection();
    const userId = ctx.state.userId as string;
    if (!userId) { 
      console.log("[deleteWorkoutPlanHandler] No userId found in state");
      ctx.response.status=401; response.error="User not authenticated"; ctx.response.body=response; return; 
    }

    const planId = parseInt(ctx.params.planId);
    if (isNaN(planId)) { 
      console.log("[deleteWorkoutPlanHandler] Invalid plan ID:", ctx.params.planId);
      ctx.response.status=400; response.error="Invalid plan ID"; ctx.response.body=response; return; 
    }

    console.log("[deleteWorkoutPlanHandler] Checking plan ownership for planId:", planId, "userId:", userId);
    // Check ownership
    const plan = await dbClient.queryObject<{user_id:string}>("SELECT user_id FROM workout_plans WHERE plan_id=$1", [planId]);
    if (plan.rows.length === 0 || plan.rows[0].user_id !== userId) { 
      console.log("[deleteWorkoutPlanHandler] Plan not found or user mismatch. Found rows:", plan.rows.length);
      ctx.response.status=404; response.error="Plan not found or access denied"; ctx.response.body=response; return; 
    }

    console.log("[deleteWorkoutPlanHandler] Deleting plan exercises...");
    // Delete associated exercises first (due to foreign key constraints)
    await dbClient.queryObject("DELETE FROM plan_exercises WHERE plan_id=$1", [planId]);
    
    console.log("[deleteWorkoutPlanHandler] Deleting workout plan...");
    // Then delete the plan itself
    await dbClient.queryObject("DELETE FROM workout_plans WHERE plan_id=$1 AND user_id=$2", [planId, userId]);

    console.log("[deleteWorkoutPlanHandler] Deletion successful");
    response.success = true;
    response.message = "Workout plan deleted successfully.";
    ctx.response.status = 200;
    ctx.response.body = response;
  } catch (error) {
    console.error("Error in deleteWorkoutPlanHandler:", error);
    response.error = error instanceof Error ? error.message : "Unknown error";
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

export async function removeExerciseFromPlanHandler(ctx: RouterContext) {
  const response: ApiResponse = { success: false };
  try {
    await ensureConnection();
    const userId = ctx.state.userId as string;
    if (!userId) { ctx.response.status=401; response.error="User not authenticated"; ctx.response.body=response; return; }

    const planId = parseInt(ctx.params.planId);
    const planExerciseId = parseInt(ctx.params.planExerciseId);
    if (isNaN(planId) || isNaN(planExerciseId)) { ctx.response.status=400; response.error="Invalid ID(s)"; ctx.response.body=response; return; }

    // Check plan ownership before allowing exercise removal
    const plan = await dbClient.queryObject<{user_id:string}>(
      "SELECT wp.user_id FROM workout_plans wp JOIN plan_exercises pe ON wp.plan_id = pe.plan_id WHERE pe.plan_exercise_id=$1 AND wp.plan_id=$2", 
      [planExerciseId, planId]
    );
    if (plan.rows.length === 0 || plan.rows[0].user_id !== userId) { ctx.response.status=404; response.error="Exercise not found in plan or access denied"; ctx.response.body=response; return; }

    await dbClient.queryObject("DELETE FROM plan_exercises WHERE plan_exercise_id=$1 AND plan_id=$2", [planExerciseId, planId]);
    
    response.success = true;
    response.message = "Exercise removed from plan.";
    ctx.response.status = 200;
    ctx.response.body = response;
  } catch (error) {
    console.error("Error in removeExerciseFromPlanHandler:", error);
    response.error = error instanceof Error ? error.message : "Unknown error";
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

// --- New: Update a specific exercise within a workout plan ---
export async function updatePlanExerciseHandler(ctx: RouterContext) {
  console.log("[updatePlanExerciseHandler] Handler called");
  const response: ApiResponse<PlanExerciseSchema> = { success: false };

  try {
    await ensureConnection();
    const userId = ctx.state.userId as string;
    const planId = parseInt(ctx.params.planId);
    const planExerciseId = parseInt(ctx.params.planExerciseId);

    console.log(`[updatePlanExerciseHandler] Plan ID: ${planId}, PlanExercise ID: ${planExerciseId}, User ID: ${userId}`);

    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }
    if (isNaN(planId) || isNaN(planExerciseId)) {
      ctx.response.status = 400;
      response.error = "Invalid plan ID or plan exercise ID";
      ctx.response.body = response;
      return;
    }

    // Verify plan ownership and that the plan_exercise belongs to the plan
    const ownershipCheckQuery = `
      SELECT pe.plan_exercise_id
      FROM plan_exercises pe
      JOIN workout_plans wp ON pe.plan_id = wp.plan_id
      WHERE pe.plan_exercise_id = $1 AND wp.plan_id = $2 AND wp.user_id = $3
    `;
    const ownershipResult = await dbClient.queryObject(ownershipCheckQuery, [planExerciseId, planId, userId]);

    if (ownershipResult.rows.length === 0) {
      ctx.response.status = 404;
      response.error = "Exercise not found in plan, or plan access denied.";
      ctx.response.body = response;
      return;
    }

    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      response.error = "Request body is required for update";
      ctx.response.body = response;
      return;
    }

    const body = ctx.request.body({ type: 'json' });
    const payload = await body.value as UpdatePlanExerciseRequest;

    // Build the update query dynamically based on provided fields
    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];
    let valueCounter = 1;

    if (payload.sets !== undefined) { updateFields.push(`sets = $${valueCounter++}`); updateValues.push(payload.sets); }
    if (payload.reps !== undefined) { updateFields.push(`reps = $${valueCounter++}`); updateValues.push(payload.reps); }
    if (payload.weight_kg !== undefined) { updateFields.push(`weight_kg = $${valueCounter++}`); updateValues.push(payload.weight_kg); }
    if (payload.duration_minutes !== undefined) { updateFields.push(`duration_minutes = $${valueCounter++}`); updateValues.push(payload.duration_minutes); }
    if (payload.rest_period_seconds !== undefined) { updateFields.push(`rest_period_seconds = $${valueCounter++}`); updateValues.push(payload.rest_period_seconds); }
    if (payload.notes !== undefined) { updateFields.push(`notes = $${valueCounter++}`); updateValues.push(payload.notes); }
    // Add order_in_plan if you implement reordering
    // if (payload.order_in_plan !== undefined) { updateFields.push(`order_in_plan = $${valueCounter++}`); updateValues.push(payload.order_in_plan); }

    if (updateFields.length === 0) {
      ctx.response.status = 400;
      response.error = "No fields provided to update";
      ctx.response.body = response;
      return;
    }

    // Add plan_id and plan_exercise_id to the end of updateValues for the WHERE clause
    updateValues.push(planExerciseId);
    updateValues.push(planId);

    // Construct the SET part of the query. If updateFields is not empty, join them.
    // If it is empty, this will result in an error later, which is fine as we check updateFields.length.
    const setClause = updateFields.length > 0 ? updateFields.join(", ") : ""; 

    const updateQuery = `
      UPDATE plan_exercises
      SET ${setClause}
      WHERE plan_exercise_id = $${valueCounter++} AND plan_id = $${valueCounter++}
      RETURNING plan_exercise_id, plan_id, exercise_id, exercise_name, order_in_plan, sets, reps, weight_kg, duration_minutes, rest_period_seconds, notes
    `;
    
    // Ensure that if setClause is not empty, we are not trying to add a comma before an empty string
    // This is implicitly handled by the check `if (updateFields.length === 0)` before this.
    // However, if updated_at was the *only* thing being set, and updateFields was empty, 
    // the previous query `SET , updated_at =` would be invalid.
    // The current logic correctly handles if updateFields is empty.

    console.log("[updatePlanExerciseHandler] Update Query:", updateQuery);
    console.log("[updatePlanExerciseHandler] Update Values:", updateValues);

    const result = await dbClient.queryObject<PlanExerciseSchema>(updateQuery, updateValues);

    if (result.rows.length === 0) {
      throw new Error("Failed to update plan exercise - no data returned from database or IDs did not match");
    }

    response.success = true;
    response.data = result.rows[0];
    response.message = "Exercise in plan updated successfully";
    ctx.response.status = 200;
    ctx.response.body = response;

  } catch (error) {
    console.error("Error in updatePlanExerciseHandler:", error);
    response.success = false;
    response.error = error instanceof Error ? error.message : "Unknown error occurred";
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

/**
 * Updates a workout log (for editing workout names stored in notes)
 */
export async function updateWorkoutLogHandler(ctx: RouterContext) {
  const response: ApiResponse<WorkoutLogSchema> = { success: false };
  
  try {
    // 1. Validate authentication
    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }

    // 2. Validate log ID
    const logId = parseInt(ctx.params.logId);
    if (isNaN(logId)) {
      ctx.response.status = 400;
      response.error = "Invalid log ID";
      ctx.response.body = response;
      return;
    }

    // 3. Parse request body
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      response.error = "Request body is required";
      ctx.response.body = response;
      return;
    }

    const body = ctx.request.body({ type: 'json' });
    const payload = await body.value as {
      notes?: string;
      duration_minutes?: number;
    };

    // 4. Verify the workout log belongs to the user
    const ownershipQuery = `
      SELECT user_id FROM workout_logs WHERE log_id = $1
    `;
    const ownershipResult = await dbClient.queryObject<{ user_id: string }>(
      ownershipQuery,
      [logId]
    );

    if (ownershipResult.rows.length === 0) {
      ctx.response.status = 404;
      response.error = "Workout log not found";
      ctx.response.body = response;
      return;
    }

    if (ownershipResult.rows[0].user_id !== userId) {
      ctx.response.status = 403;
      response.error = "Access denied";
      ctx.response.body = response;
      return;
    }

    // 5. Update the workout log
    const updateQuery = `
      UPDATE workout_logs 
      SET notes = COALESCE($1, notes),
          duration_minutes = COALESCE($2, duration_minutes)
      WHERE log_id = $3 AND user_id = $4
      RETURNING log_id, user_id, plan_id, log_date, duration_minutes, notes, created_at
    `;

    const result = await dbClient.queryObject<WorkoutLogSchema>(
      updateQuery,
      [payload.notes || null, payload.duration_minutes || null, logId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to update workout log");
    }

    // 6. Send success response
    response.success = true;
    response.data = result.rows[0];
    response.message = "Workout log updated successfully";
    
    ctx.response.status = 200;
    ctx.response.body = response;

  } catch (error) {
    console.error("Error in updateWorkoutLogHandler:", error);
    
    response.success = false;
    response.error = error instanceof Error ? error.message : "Unknown error occurred";
    
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

// --- TODO: Add handlers for other workout management actions ---