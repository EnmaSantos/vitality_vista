import { Router } from "../deps.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import { getUserMetricLogsHandler, getDailyCalorieSummaryHandler } from "../controllers/progressController.ts";

const progressRouter = new Router();

// GET /api/progress/metrics/:metricType - Fetches historical data for a specific metric for the logged-in user
progressRouter.get(
  "/api/progress/metrics/:metricType",
  authMiddleware, // Protect the route
  getUserMetricLogsHandler
);

// GET /api/progress/daily-calories - Get daily calorie summary (food consumed + exercise burned)
progressRouter.get(
  "/api/progress/daily-calories",
  authMiddleware,
  getDailyCalorieSummaryHandler
);

// TODO: Add route for logging a new body metric (e.g., POST /api/progress/metrics)
// progressRouter.post("/api/progress/metrics", authMiddleware, logUserBodyMetricHandler);

export default progressRouter; 