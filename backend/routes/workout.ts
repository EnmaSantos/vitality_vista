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

// --- Workout Log Routes ---

// POST /api/workout-logs
// Creates a new workout log (actual workout session)
workoutRouter.post("/workout-logs", authMiddleware, createWorkoutLogHandler);

// GET /api/workout-logs
// Gets all workout logs for the authenticated user
workoutRouter.get("/workout-logs", authMiddleware, getUserWorkoutLogsHandler);

// POST /api/workout-logs/:logId/exercises
// Logs exercise details for a specific workout session
workoutRouter.post("/workout-logs/:logId/exercises", authMiddleware, logExerciseDetailsHandler);

// --- TODO: Add routes for other workout plan/log actions ---
// e.g., GET /api/workout-plans/:planId -> getWorkoutPlanByIdHandler
// e.g., PUT /api/workout-plans/:planId -> updateWorkoutPlanHandler
// e.g., DELETE /api/workout-plans/:planId -> deleteWorkoutPlanHandler

// Export the configured router
export default workoutRouter;