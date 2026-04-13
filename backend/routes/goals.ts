import { Router, Context } from "../deps.ts";
import {
    getDailyGoalsHandler,
    addGoalHandler,
    updateGoalHandler,
    deleteGoalHandler
} from "../controllers/goalController.ts";

const goalsRouter = new Router();

// AUTH BYPASS: design-no-auth branch
const MOCK_USER_ID = Deno.env.get("MOCK_USER_ID") || "00000000-0000-0000-0000-000000000000";

goalsRouter.use(async (ctx: Context, next: () => Promise<unknown>) => {
    ctx.state.userId = MOCK_USER_ID;
    await next();
});

goalsRouter.get("/", getDailyGoalsHandler);
goalsRouter.post("/", addGoalHandler);
goalsRouter.put("/:id", updateGoalHandler);
goalsRouter.delete("/:id", deleteGoalHandler);

export default goalsRouter;
