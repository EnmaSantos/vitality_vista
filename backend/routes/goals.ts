import { Context, Router } from "../deps.ts";
import {
  addGoalHandler,
  deleteGoalHandler,
  getDailyGoalsHandler,
  updateGoalHandler,
} from "../controllers/goalController.ts";
import { verifyJwt } from "../deps.ts";
import { key } from "../utils/api_key.ts";

const goalsRouter = new Router();

// Middleware to verify JWT for all goal routes
goalsRouter.use(async (ctx: Context, next: () => Promise<unknown>) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Access token is missing",
      };
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = await verifyJwt(token, key);

    if (!payload) {
      throw new Error("Invalid token");
    }

    if (!payload.sub) {
      throw new Error("Token subject is missing");
    }

    ctx.state.userId = payload.sub;
    await next();
  } catch (error) {
    console.warn("Goal route authentication failed:", error);
    ctx.response.status = 401;
    ctx.response.body = {
      success: false,
      message: "Invalid or expired token",
    };
  }
});

goalsRouter.get("/", getDailyGoalsHandler);
goalsRouter.post("/", addGoalHandler);
goalsRouter.put("/:id", updateGoalHandler);
goalsRouter.delete("/:id", deleteGoalHandler);

export default goalsRouter;
