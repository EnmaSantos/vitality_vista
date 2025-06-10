import { Router } from "../deps.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import { getUserMetricLogsHandler } from "../controllers/progressController.ts";

const progressRouter = new Router();

// GET /api/progress/metrics/:metricType - Fetches historical data for a specific metric for the logged-in user
progressRouter.get(
  "/api/progress/metrics/:metricType",
  authMiddleware, // Protect the route
  getUserMetricLogsHandler
);

// TODO: Add route for logging a new body metric (e.g., POST /api/progress/metrics)
// progressRouter.post("/api/progress/metrics", authMiddleware, logUserBodyMetricHandler);

export default progressRouter; 