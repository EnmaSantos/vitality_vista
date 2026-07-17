import { Context, Router } from "../deps.ts";
import {
  getBodyRegions,
  getCatalogMetadata,
  getPublicExercise,
  getRoutineBySlug,
  getSports,
  queryPublicExercises,
  queryRoutines,
} from "../services/routineCatalogService.ts";
import { openApiContract } from "../services/openApiContract.ts";

const publicCatalogRouter = new Router({ prefix: "/v1" });
const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;

export async function publicCatalogCorsMiddleware(ctx: Context, next: () => Promise<unknown>) {
  const path = ctx.request.url.pathname;
  if (!path.startsWith("/api/v1") && !path.startsWith("/v1")) {
    await next();
    return;
  }
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Accept, Content-Type, If-None-Match");
  ctx.response.headers.set("Access-Control-Expose-Headers", "ETag, Retry-After");
  // Keep conditional requests out of the same edge-cache variant as ordinary
  // reads so If-None-Match can reach the catalog handler and return 304.
  ctx.response.headers.set("Vary", "If-None-Match");
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }
  await next();
}

function intParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function booleanParam(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function requestIp(ctx: Context): string {
  return ctx.request.headers.get("cf-connecting-ip") ??
    ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ctx.request.ip ?? "unknown";
}

function etagFor(ctx: Context): string {
  const source = `${getCatalogMetadata().catalogVersion}:${ctx.request.url.pathname}:${ctx.request.url.search}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  return `W/\"${(hash >>> 0).toString(16)}\"`;
}

publicCatalogRouter.use(async (ctx, next) => {
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }
  await publicCatalogCorsMiddleware(ctx, async () => {});
  if (ctx.request.method !== "GET" && ctx.request.method !== "HEAD") {
    ctx.response.status = 405;
    return;
  }

  const now = Date.now();
  const ip = requestIp(ctx);
  const existing = requestBuckets.get(ip);
  const bucket = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + RATE_WINDOW_MS } : existing;
  bucket.count += 1;
  requestBuckets.set(ip, bucket);
  if (bucket.count > RATE_LIMIT) {
    ctx.response.status = 429;
    ctx.response.headers.set("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
    ctx.response.body = { success: false, error: "Rate limit exceeded" };
    return;
  }

  const etag = etagFor(ctx);
  if (ctx.request.headers.get("if-none-match") === etag) {
    ctx.response.status = 304;
    ctx.response.headers.set("ETag", etag);
    ctx.response.headers.set("Cache-Control", "public, max-age=300, s-maxage=3600");
    return;
  }
  await next();
  if (ctx.response.status >= 200 && ctx.response.status < 300) {
    ctx.response.headers.set("ETag", etag);
    ctx.response.headers.set("Cache-Control", "public, max-age=300, s-maxage=3600");
  }
});

publicCatalogRouter.get("/meta", (ctx) => {
  ctx.response.body = getCatalogMetadata();
});

publicCatalogRouter.get("/exercises", (ctx) => {
  const params = ctx.request.url.searchParams;
  ctx.response.body = queryPublicExercises({
    page: intParam(params.get("page")), limit: intParam(params.get("limit")),
    q: params.get("search") ?? params.get("q") ?? undefined,
    category: params.get("category") ?? undefined, equipment: params.get("equipment") ?? undefined,
    muscle: params.get("muscle") ?? undefined, bodyRegion: params.get("bodyRegion") ?? params.get("body_region") ?? undefined,
    sport: params.get("sport") ?? undefined, difficulty: params.get("difficulty") ?? undefined, impact: params.get("impact") ?? undefined,
  });
});

publicCatalogRouter.get("/exercises/:id", (ctx) => {
  const exercise = getPublicExercise(ctx.params.id);
  if (!exercise) {
    ctx.response.status = 404;
    ctx.response.body = { success: false, error: "Exercise not found" };
    return;
  }
  ctx.response.body = exercise;
});

publicCatalogRouter.get("/routines", (ctx) => {
  const params = ctx.request.url.searchParams;
  ctx.response.body = queryRoutines({
    page: intParam(params.get("page")), limit: intParam(params.get("limit")),
    q: params.get("search") ?? params.get("q") ?? undefined,
    goal: params.get("goal") ?? undefined, equipment: params.get("equipment") ?? undefined,
    difficulty: params.get("difficulty") ?? undefined, format: params.get("format") ?? undefined,
    bodyRegion: params.get("bodyRegion") ?? params.get("body_region") ?? undefined,
    sport: params.get("sport") ?? undefined, maximumDuration: intParam(params.get("maxDuration") ?? params.get("maximum_duration")),
    wellness: booleanParam(params.get("wellness")),
  });
});

publicCatalogRouter.get("/routines/:slug", (ctx) => {
  const routine = getRoutineBySlug(ctx.params.slug);
  if (!routine) {
    ctx.response.status = 404;
    ctx.response.body = { success: false, error: "Routine not found" };
    return;
  }
  ctx.response.body = routine;
});

publicCatalogRouter.get("/body-regions", (ctx) => {
  ctx.response.body = { items: getBodyRegions(), catalogVersion: getCatalogMetadata().catalogVersion };
});

publicCatalogRouter.get("/sports", (ctx) => {
  ctx.response.body = { items: getSports(), catalogVersion: getCatalogMetadata().catalogVersion };
});

publicCatalogRouter.get("/openapi.json", (ctx) => {
  ctx.response.body = openApiContract;
});

export function resetPublicCatalogRateLimitsForTests() {
  requestBuckets.clear();
}

export default publicCatalogRouter;
