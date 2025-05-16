// server.ts
import { Application, oakCors, loadEnv, Router } from "./deps.ts";

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
// import { authMiddleware } from "./middleware/authMiddleware.ts"; // authMiddleware is used by routers internally

// Import new specific routers
import fatsecretProxyRouter from "./routes/fatsecretProxy.ts";
import foodLogRouter from "./routes/foodLogRoutes.ts";

// Initialize the app
const app = new Application();
const port = parseInt(Deno.env.get("PORT") || "8000"); // Uses env var loaded above


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
app.use(async (ctx, next) => {
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

// Mount Workout routes 
apiRouter.use("/workouts", workoutRouter.routes(), workoutRouter.allowedMethods());

// Register the main API router with the application
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

// Default route (Handles requests that don't match any api routes)
app.use((ctx) => {
  // Check if it looks like an API request that wasn't caught
  if (ctx.request.url.pathname.startsWith('/api/')) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, message: "API endpoint not found." };
  } else {
     // Handle non-API routes (e.g., potentially serving frontend static files later)
     // For now, keep the welcome message or send a 404
     ctx.response.body = {
       success: true,
       message: "Welcome to Vitality Vista API",
       timestamp: new Date().toISOString(),
     };
     // Or ctx.response.status = 404;
  }
});

// Start the server
console.log(`🚀 Server running on http://localhost:${port}`);
await app.listen({ port });