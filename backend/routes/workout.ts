// backend/routes/workout.ts

import { Router } from "../deps.ts"; // Import Router from Oak/deps
// Import the handler functions from workoutController.ts
import {
  createWorkoutPlanHandler,
  getUserWorkoutPlansHandler,
  addExerciseToPlanHandler, // Import the new handler
  // Import other handlers here later as needed
} from "../controllers/workoutController.ts";
// Import the authentication middleware to protect these routes
import { authMiddleware } from "../middleware/authMiddleware.ts";

// Create a new router instance with a prefix for workout plan routes
const workoutRouter = new Router({
  prefix: "/workout-plans", // Using '/workout-plans' as the base path (without /api since it will be mounted under apiRouter)
});

// --- Define Workout Plan Routes ---

// POST /api/workout-plans
// Creates a new workout plan for the authenticated user.
// Runs authMiddleware first, then the createWorkoutPlanHandler.
workoutRouter.post("/", authMiddleware, createWorkoutPlanHandler);

// GET /api/workout-plans
// Gets all workout plans belonging to the authenticated user.
// Runs authMiddleware first, then the getUserWorkoutPlansHandler.
workoutRouter.get("/", authMiddleware, getUserWorkoutPlansHandler);

// POST /api/workout-plans/:planId/exercises
// Adds an exercise to a specific workout plan for the authenticated user.
workoutRouter.post("/:planId/exercises", authMiddleware, addExerciseToPlanHandler);

// --- TODO: Add routes for other workout plan/log actions ---
// e.g., GET /api/workout-plans/:planId -> getWorkoutPlanByIdHandler
// e.g., PUT /api/workout-plans/:planId -> updateWorkoutPlanHandler
// e.g., DELETE /api/workout-plans/:planId -> deleteWorkoutPlanHandler
// e.g., POST /api/workout-logs -> createWorkoutLogHandler
// e.g., GET /api/workout-logs -> getUserWorkoutLogsHandler


// Export the configured router
export default workoutRouter;