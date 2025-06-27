// backend/routes/workout.ts

import { Router } from "../deps.ts"; // Import Router from Oak/deps
// Import the handler functions from workoutController.ts
import {
  createWorkoutPlanHandler,
  getUserWorkoutPlansHandler,
  addExerciseToPlanHandler,
  createWorkoutLogHandler,
  getUserWorkoutLogsHandler,
  logExerciseDetailsHandler,
  getPlanExercisesHandler,
  deleteWorkoutPlanHandler,
  removeExerciseFromPlanHandler,
  updatePlanExerciseHandler,
  getWorkoutLogDetailsHandler,
  updateWorkoutLogHandler,
  updateWorkoutPlanHandler,
} from "../controllers/workoutController.ts";
// Import the authentication middleware to protect these routes
import { authMiddleware } from "../middleware/authMiddleware.ts";

// Create a new router instance
const workoutRouter = new Router();

// --- Workout Plan Routes ---

// POST /api/workout-plans
// Creates a new workout plan for the authenticated user.
workoutRouter.post("/workout-plans", authMiddleware, createWorkoutPlanHandler);

// GET /api/workout-plans
// Gets all workout plans belonging to the authenticated user.
workoutRouter.get("/workout-plans", authMiddleware, getUserWorkoutPlansHandler);

// POST /api/workout-plans/:planId/exercises
// Adds an exercise to a specific workout plan for the authenticated user.
workoutRouter.post("/workout-plans/:planId/exercises", authMiddleware, addExerciseToPlanHandler);

// GET /api/workout-plans/:planId/exercises (list exercises in a plan)
workoutRouter.get("/workout-plans/:planId/exercises", authMiddleware, getPlanExercisesHandler);

// DELETE /api/workout-plans/:planId
// Deletes a workout plan for the authenticated user.
workoutRouter.delete("/workout-plans/:planId", authMiddleware, deleteWorkoutPlanHandler);

// PUT /api/workout-plans/:planId
// Updates a workout plan's details.
workoutRouter.put("/workout-plans/:planId", authMiddleware, updateWorkoutPlanHandler);

// POST /api/workout-plans/:planId/exercises/:planExerciseId
// Removes an exercise from a specific workout plan for the authenticated user.
workoutRouter.delete("/workout-plans/:planId/exercises/:planExerciseId", authMiddleware, removeExerciseFromPlanHandler);

// PUT /api/workout-plans/:planId/exercises/:planExerciseId
// Updates a specific exercise within a workout plan for the authenticated user.
workoutRouter.put("/workout-plans/:planId/exercises/:planExerciseId", authMiddleware, updatePlanExerciseHandler);

// --- Workout Log Routes ---

// POST /api/workout-logs
// Creates a new workout log (actual workout session)
workoutRouter.post("/workout-logs", authMiddleware, createWorkoutLogHandler);

// GET /api/workout-logs
// Gets all workout logs for the authenticated user
workoutRouter.get("/workout-logs", authMiddleware, getUserWorkoutLogsHandler);

// PUT /api/workout-logs/:logId
// Updates a workout log (notes, duration, etc.)
workoutRouter.put("/workout-logs/:logId", authMiddleware, updateWorkoutLogHandler);

// GET /api/workout-logs/:logId/exercises
// Gets exercise details for a specific workout log
workoutRouter.get("/workout-logs/:logId/exercises", authMiddleware, getWorkoutLogDetailsHandler);

// POST /api/workout-logs/:logId/exercises
// Logs exercise details for a specific workout session
workoutRouter.post("/workout-logs/:logId/exercises", authMiddleware, logExerciseDetailsHandler);

// --- TODO: Add routes for other workout plan/log actions ---
// e.g., GET /api/workout-plans/:planId -> getWorkoutPlanByIdHandler
// e.g., PUT /api/workout-plans/:planId -> updateWorkoutPlanHandler

// Export the configured router
export default workoutRouter;