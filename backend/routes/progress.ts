import { Router } from "../deps.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import { getUserMetricLogsHandler, getDailyCalorieSummaryHandler, getProgressDataHandler, getExerciseProgressHandler } from "../controllers/progressController.ts";

const progressRouter = new Router();

// GET /api/progress/metrics/:metricType - Fetches historical data for a specific metric for the logged-in user
progressRouter.get(
  "/metrics/:metricType",
  authMiddleware, // Protect the route
  getUserMetricLogsHandler
);

// GET /api/progress/daily-calories - Get daily calorie summary (food consumed + exercise burned)
progressRouter.get(
  "/daily-calories",
  authMiddleware,
  getDailyCalorieSummaryHandler
);

// GET /api/progress - Get comprehensive progress data for charts and analysis
progressRouter.get(
  "/",
  authMiddleware,
  getProgressDataHandler
);

// GET /api/progress/exercises - Get exercise progress and PRs
progressRouter.get(
  "/exercises",
  authMiddleware,
  getExerciseProgressHandler
);

// TODO: Add route for logging a new body metric (e.g., POST /api/progress/metrics)
// progressRouter.post("/api/progress/metrics", authMiddleware, logUserBodyMetricHandler);

export default progressRouter; 