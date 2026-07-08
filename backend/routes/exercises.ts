import { Router, RouterContext } from "../deps.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const exercisesRouter = new Router();
const EXERCISE_API_URL = Deno.env.get("EXERCISE_API_URL") || "https://excersice-api.fly.dev/";

// Helper to clean trailing slash
const getBaseUrl = () => {
  const url = EXERCISE_API_URL.trim();
  return url.endsWith("/") ? url : `${url}/`;
};

// GET /api/exercises/meta — proxy to v2/exercises/meta
exercisesRouter.get("/meta", authMiddleware, async (ctx: RouterContext<any, any>) => {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}v2/exercises/meta`;
    console.log(`[Proxy] Fetching exercise metadata from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      ctx.response.status = response.status;
      ctx.response.body = { success: false, message: `Failed to fetch exercise metadata: ${response.statusText}` };
      return;
    }

    const data = await response.json();
    ctx.response.status = 200;
    ctx.response.body = data;
  } catch (error) {
    console.error("Error in exercises/meta proxy:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error in exercises meta proxy" };
  }
});

// GET /api/exercises — proxy to v2/exercises with query params (paginated)
exercisesRouter.get("/", authMiddleware, async (ctx: RouterContext<any, any>) => {
  try {
    const baseUrl = getBaseUrl();
    const searchParams = ctx.request.url.searchParams;
    const url = new URL(`${baseUrl}v2/exercises`);
    // Forward all query params (page, limit, q, category, level, equipment, muscle)
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    console.log(`[Proxy] Fetching exercises from: ${url.toString()}`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      ctx.response.status = response.status;
      ctx.response.body = { success: false, message: `Failed to fetch exercises: ${response.statusText}` };
      return;
    }

    const data = await response.json();
    ctx.response.status = 200;
    ctx.response.body = data;
  } catch (error) {
    console.error("Error in exercises proxy:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error in exercises proxy" };
  }
});

// GET /api/exercises/:id — proxy to v2/exercises/:id
exercisesRouter.get("/:id", authMiddleware, async (ctx: RouterContext<any, any>) => {
  try {
    const id = ctx.params.id;
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}v2/exercises/${id}`;
    console.log(`[Proxy] Fetching exercise by id from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      ctx.response.status = response.status;
      ctx.response.body = { success: false, message: `Failed to fetch exercise: ${response.statusText}` };
      return;
    }
    
    const data = await response.json();
    ctx.response.status = 200;
    ctx.response.body = data;
  } catch (error) {
    console.error("Error in exercises/:id proxy:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error in exercises proxy" };
  }
});

// GET /api/exercises/search/:name
exercisesRouter.get("/search/:name", authMiddleware, async (ctx: RouterContext<any, any>) => {
  try {
    const name = ctx.params.name;
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}exercises/search/${encodeURIComponent(name)}`;
    console.log(`[Proxy] Searching exercises from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      ctx.response.status = response.status;
      ctx.response.body = { success: false, message: `Failed to search exercises: ${response.statusText}` };
      return;
    }
    
    const data = await response.json();
    ctx.response.status = 200;
    ctx.response.body = data;
  } catch (error) {
    console.error("Error in exercises/search/:name proxy:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error in exercises proxy" };
  }
});

export default exercisesRouter;
