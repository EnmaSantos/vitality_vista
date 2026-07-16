import { Router, RouterContext } from "../deps.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import {
  getAllExercises,
  getExerciseById,
  getExerciseMeta,
  queryExercises,
} from "../services/exerciseDatasetService.ts";

const exercisesRouter = new Router();

function parsePositiveInteger(value: string | null): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

// GET /api/exercises/meta
exercisesRouter.get("/meta", authMiddleware, (ctx: RouterContext<any, any>) => {
  ctx.response.status = 200;
  ctx.response.body = getExerciseMeta();
});

// GET /api/exercises/search/:name - retained for older clients.
exercisesRouter.get(
  "/search/:name",
  authMiddleware,
  (ctx: RouterContext<any, any>) => {
    ctx.response.status = 200;
    ctx.response.body =
      queryExercises({ q: ctx.params.name, page: 1, limit: 100 }).items;
  },
);

// GET /api/exercises/all - explicit bulk endpoint used by offline/cache consumers.
exercisesRouter.get("/all", authMiddleware, (ctx: RouterContext<any, any>) => {
  ctx.response.status = 200;
  ctx.response.body = getAllExercises();
});

// GET /api/exercises/:id
exercisesRouter.get("/:id", authMiddleware, (ctx: RouterContext<any, any>) => {
  const exercise = getExerciseById(ctx.params.id);
  if (!exercise) {
    ctx.response.status = 404;
    ctx.response.body = { success: false, message: "Exercise not found" };
    return;
  }

  ctx.response.status = 200;
  ctx.response.body = exercise;
});

// GET /api/exercises?page=1&limit=20&q=&category=&equipment=&muscle=
exercisesRouter.get("/", authMiddleware, (ctx: RouterContext<any, any>) => {
  const searchParams = ctx.request.url.searchParams;

  ctx.response.status = 200;
  ctx.response.body = queryExercises({
    page: parsePositiveInteger(searchParams.get("page")),
    limit: parsePositiveInteger(searchParams.get("limit")),
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    equipment: searchParams.get("equipment") || undefined,
    muscle: searchParams.get("muscle") || undefined,
  });
});

export default exercisesRouter;
