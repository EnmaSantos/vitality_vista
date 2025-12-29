import { Router } from "../deps.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import { logWaterHandler, getDailyWaterHandler } from "../controllers/waterController.ts";

const waterRouter = new Router();

// Log water intake
waterRouter.post("/", authMiddleware, logWaterHandler);

// Get daily water intake
waterRouter.get("/daily", authMiddleware, getDailyWaterHandler);

export default waterRouter;
