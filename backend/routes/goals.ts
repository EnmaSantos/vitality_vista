import { Router } from "../deps.ts";
import {
    getDailyGoalsHandler,
    addGoalHandler,
    updateGoalHandler,
    deleteGoalHandler
} from "../controllers/goalController.ts";
import { verifyJwt } from "../deps.ts";
import { key } from "../utils/apiKey.ts";

const goalsRouter = new Router();

// Middleware to verify JWT for all goal routes
goalsRouter.use(async (ctx, next) => {
    try {
        const authHeader = ctx.request.headers.get("Authorization");
        if (!authHeader) {
            ctx.response.status = 401;
            ctx.response.body = { success: false, message: "Access token is missing" };
            return;
        }

        const token = authHeader.replace("Bearer ", "");
        const payload = await verifyJwt(token, key);

        if (!payload) {
            throw new Error("Invalid token");
        }

        ctx.state.userId = payload.id;
        await next();
    } catch (error) {
        ctx.response.status = 401;
        ctx.response.body = {
            success: false,
            message: "Invalid or expired token",
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
});

goalsRouter.get("/", getDailyGoalsHandler);
goalsRouter.post("/", addGoalHandler);
goalsRouter.put("/:id", updateGoalHandler);
goalsRouter.delete("/:id", deleteGoalHandler);

export default goalsRouter;
