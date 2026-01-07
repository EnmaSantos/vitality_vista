// server.ts
import { Application, oakCors, loadEnv, Router, Context } from "./deps.ts";

// Load environment variables for the server itself (e.g., PORT)
await loadEnv({ export: true });

// Remove the temporary import for db.ts - it's no longer needed here
// import "./services/db.ts"; // <-- REMOVE OR COMMENT OUT THIS LINE
import "./services/db.ts";
// Import controllers directly for this approach
import { handleSearchFatSecretRecipes, handleGetFatSecretRecipeById, handleGetFatSecretRecipeTypes } from "./controllers/recipeController.ts";
// Food controller handlers are now imported by the specific routers
import authRouter from "./routes/auth.ts";
import workoutRouter from "./routes/workout.ts";
import profileRouter from "./routes/profile.ts"; // Import the profile router
import progressRouter from "./routes/progress.ts"; // Import the progress router
// import { authMiddleware } from "./middleware/authMiddleware.ts"; // authMiddleware is used by routers internally

// Import new specific routers
import fatsecretProxyRouter from "./routes/fatsecretProxy.ts";
import foodLogRouter from "./routes/foodLogRoutes.ts";
import waterRouter from "./routes/water.ts";
import setupRouter from "./routes/setup.ts";
import goalsRouter from "./routes/goals.ts";

// Initialize the app
const app = new Application();
// Access environment variables for Deno deployment
const port = parseInt((globalThis as any).Deno?.env.get("PORT") || "8000");


// Basic middleware with improved CORS configuration
app.use(oakCors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://vitality-vista.vercel.app",
    "https://vitality-vista.vercel.app/"
  ],
  optionsSuccessStatus: 200,
}));

// Logger middleware
app.use(async (ctx: Context, next: () => Promise<unknown>) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${ctx.response.status} - ${ms}ms`);
});

// --- Set up API Routing --- 

const apiRouter = new Router({ prefix: "/api" });

// Mount Auth routes
apiRouter.use(authRouter.routes());
apiRouter.use(authRouter.allowedMethods());

// --- Define FatSecret Recipe routes DIRECTLY under apiRouter ---
apiRouter
  .get("/fatsecret/recipes/search", handleSearchFatSecretRecipes)
  .get("/fatsecret/recipes/types", handleGetFatSecretRecipeTypes)
  .get("/fatsecret/recipes/:id", handleGetFatSecretRecipeById);

// Mount FatSecret Food Search/Details proxy routes
apiRouter.use("/fatsecret/foods", fatsecretProxyRouter.routes(), fatsecretProxyRouter.allowedMethods());

// Mount Food Logging routes
apiRouter.use("/food-logs", foodLogRouter.routes(), foodLogRouter.allowedMethods());

// Mount Water Logging routes
apiRouter.use("/water-logs", waterRouter.routes(), waterRouter.allowedMethods());

// Mount Daily Goals routes
apiRouter.use("/goals", goalsRouter.routes(), goalsRouter.allowedMethods());

// Mount Setup routes (Temporary)
apiRouter.use("/setup-db", setupRouter.routes(), setupRouter.allowedMethods());

// Mount Workout routes
apiRouter.use(workoutRouter.routes(), workoutRouter.allowedMethods());

// Mount Profile routes
// profileRouter has a prefix "/users/me/profile", so combined with apiRouter prefix "/api",
// the routes will be /api/users/me/profile
apiRouter.use(profileRouter.routes());
apiRouter.use(profileRouter.allowedMethods());

// Mount Progress routes
apiRouter.use("/progress", progressRouter.routes());
apiRouter.use(progressRouter.allowedMethods());

// Register the main API router with the application
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

// Default route (Handles requests that don't match any api routes)
app.use((ctx) => {
  // Log the path that made it here to understand why it wasn't routed.
  console.log(`Default handler reached for path: ${ctx.request.method} ${ctx.request.url.pathname}`);

  // For any unhandled request, it's effectively a 404.
  ctx.response.status = 404;
  if (ctx.request.url.pathname.startsWith('/api/')) {
    ctx.response.body = { success: false, message: `API endpoint ${ctx.request.url.pathname} not found.` };
  } else {
    // For non-API paths, a simpler message or different 404 page.
    ctx.response.body = { success: false, message: `Resource ${ctx.request.url.pathname} not found.` };
  }
});

// Start the server
console.log(`🚀 Server running on http://localhost:${port}`);
await app.listen({ port });