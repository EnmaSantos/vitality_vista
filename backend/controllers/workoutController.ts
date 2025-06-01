// backend/controllers/workoutController.ts

import { Context } from "../deps.ts"; // Import Oak Context
import dbClient from "../services/db.ts"; // Import the database client
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

/**
 * Creates a new workout plan for the authenticated user
 */
export async function createWorkoutPlanHandler(ctx: Context) {
  const response: ApiResponse<WorkoutPlanSchema> = { success: false };
  
  try {
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
export async function getUserWorkoutPlansHandler(ctx: Context) {
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
export async function addExerciseToPlanHandler(ctx: Context) {
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
export async function createWorkoutLogHandler(ctx: Context) {
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
export async function logExerciseDetailsHandler(ctx: Context) {
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
export async function getUserWorkoutLogsHandler(ctx: Context) {
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

// --- TODO: Add handlers for other workout management actions ---
// export async function getWorkoutPlanByIdHandler(ctx: Context) { ... }
// export async function updateWorkoutPlanHandler(ctx: Context) { ... }
// export async function deleteWorkoutPlanHandler(ctx: Context) { ... }
// export async function createWorkoutLogHandler(ctx: Context) { ... }
// ... etc ...