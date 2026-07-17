import { Application } from "../deps.ts";
import publicCatalogRouter, { publicCatalogCorsMiddleware, resetPublicCatalogRateLimitsForTests } from "../routes/publicCatalog.ts";
import {
  getBodyRegions,
  getCatalogMetadata,
  getRoutineBySlug,
  getSports,
  queryPublicExercises,
  queryRoutines,
  validateRoutineCatalog,
} from "./routineCatalogService.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function createPublicApp(): Application {
  const app = new Application();
  app.use(publicCatalogCorsMiddleware);
  app.use(publicCatalogRouter.routes());
  app.use(publicCatalogRouter.allowedMethods());
  return app;
}

Deno.test("routine catalog validates references, enums, phases, coverage, and licensing", () => {
  const errors = validateRoutineCatalog();
  assert(errors.length === 0, errors.join("\n"));
  const metadata = getCatalogMetadata();
  assert(metadata.routineCount === 50, "Expected exactly 50 routines");
  assert(metadata.license === "CC BY 4.0", "Expected the original catalog to be CC BY 4.0");
  assert(metadata.attribution === "Vitality Vista / Enma Santos", "Expected complete catalog attribution");
});

Deno.test("catalog has the required difficulty distribution", () => {
  const difficulties = ["beginner", "intermediate", "advanced"] as const;
  const counts = Object.fromEntries(difficulties.map((difficulty) => [difficulty, queryRoutines({ difficulty, limit: 50 }).total]));
  assert(counts.beginner === 20, `Expected 20 beginner routines, received ${counts.beginner}`);
  assert(counts.intermediate === 20, `Expected 20 intermediate routines, received ${counts.intermediate}`);
  assert(counts.advanced === 10, `Expected 10 advanced routines, received ${counts.advanced}`);
});

Deno.test("all body regions and sports return routines and curated exercises", () => {
  for (const region of getBodyRegions()) {
    assert(region.exerciseCount > 0, `${region.id} must return exercises`);
    assert(region.routineCount > 0, `${region.id} must return routines`);
    assert(queryPublicExercises({ bodyRegion: region.id, limit: 100 }).total > 0, `${region.id} filter must resolve exercises`);
    assert(queryRoutines({ bodyRegion: region.id, limit: 50 }).total > 0, `${region.id} filter must resolve routines`);
  }
  for (const sport of getSports()) {
    assert(sport.routineCount >= 1, `${sport.id} must have a routine`);
    assert(sport.exerciseCount >= 5, `${sport.id} must have at least five explicitly tagged exercises`);
  }
});

Deno.test("public exercise and routine filters combine with AND and bound pagination", () => {
  const exercises = queryPublicExercises({ bodyRegion: "shoulders", sport: "swimming", difficulty: "beginner", limit: 1000 });
  assert(exercises.limit === 100, "Exercise limit must be bounded at 100");
  assert(exercises.items.length > 0, "Expected curated beginner shoulder exercises for swimming");
  assert(exercises.items.every((item) => item.recommendation?.sportTags.includes("swimming")), "Expected explicit swimming tags");
  assert(exercises.items.every((item) => item.imageUrl.startsWith("https://") && item.gifUrl.startsWith("https://")), "Expected fully resolved media URLs");

  const routines = queryRoutines({ difficulty: "beginner", maximumDuration: 15, wellness: true, limit: 500 });
  assert(routines.limit === 50, "Routine limit must be bounded at 50");
  assert(routines.items.length > 0, "Expected beginner wellness routines of 15 minutes or less");
  assert(routines.items.every((routine) => routine.wellness && routine.difficulty === "beginner" && routine.estimatedDurationMinutes <= 15), "Expected all routine filters to combine with AND");
});

Deno.test("resolved routines include current IDs, media, phases, and no prescribed weights", () => {
  const routine = getRoutineBySlug("first-steps-full-body");
  assert(routine, "Expected first routine to resolve");
  assert(routine.exercises.every((item) => item.exercise.id > 0), "Expected current numeric exercise IDs");
  assert(routine.exercises.every((item) => item.exercise.imageUrl && item.exercise.gifUrl), "Expected usable media");
  assert(routine.exercises.map((item) => item.phase).join(",") === "warmup,work,work,work,work,cooldown", "Expected valid phase ordering");
  assert(routine.exercises.every((item) => !("weight" in item)), "Routine items must not prescribe default weights");
});

Deno.test("public routes allow anonymous reads and return cache, ETag, and CORS headers", async () => {
  resetPublicCatalogRateLimitsForTests();
  const app = createPublicApp();
  const response = await app.handle(new Request("http://localhost/v1/routines?limit=1", { headers: { Origin: "https://example.org" } }));
  assert(response?.status === 200, `Expected anonymous 200, received ${response?.status}`);
  assert(response.headers.get("access-control-allow-origin") === "*", "Expected public wildcard read CORS");
  assert(response.headers.get("cache-control") === "public, max-age=300, s-maxage=3600", "Expected public caching");
  assert(response.headers.get("vary")?.includes("If-None-Match"), "Expected conditional requests to use a separate edge-cache variant");
  const etag = response.headers.get("etag");
  assert(etag, "Expected an ETag");
  const cached = await app.handle(new Request("http://localhost/v1/routines?limit=1", { headers: { "If-None-Match": etag } }));
  assert(cached?.status === 304, `Expected 304 for matching ETag, received ${cached?.status}`);
  const preflight = await app.handle(new Request("http://localhost/v1/routines", { method: "OPTIONS" }));
  assert(preflight?.status === 200 || preflight?.status === 204, `Expected successful public OPTIONS response, received ${preflight?.status}`);
  assert(preflight?.headers.get("access-control-allow-methods")?.includes("GET"), "Expected GET in preflight methods");
});

Deno.test("public routes enforce the best-effort per-instance rate limit", async () => {
  resetPublicCatalogRateLimitsForTests();
  const app = createPublicApp();
  let response: Response | undefined;
  for (let request = 0; request < 121; request += 1) {
    response = await app.handle(new Request(`http://localhost/v1/meta?request=${request}`, { headers: { "cf-connecting-ip": "203.0.113.10" } })) ?? undefined;
  }
  assert(response?.status === 429, `Expected request 121 to return 429, received ${response?.status}`);
  assert(Number(response.headers.get("retry-after")) >= 1, "Expected a Retry-After header");
});
