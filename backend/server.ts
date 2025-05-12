// server.ts
import { Application, oakCors, loadEnv, Router } from "./deps.ts";

// Load environment variables for the server itself (e.g., PORT)
await loadEnv({ export: true });

// Remove the temporary import for db.ts - it's no longer needed here
// import "./services/db.ts"; // <-- REMOVE OR COMMENT OUT THIS LINE
import "./services/db.ts";
// Import routers
import authRouter from "./routes/auth.ts";
import recipeRouter from "./routes/recipes.ts"; // <-- ADD THIS IMPORT
// import foodRouter from "./routes/food.ts"; // <-- COMMENTED OUT FOR NOW
import workoutRouter from "./routes/workout.ts"; // <-- ADD THIS IMPORT

// Initialize the app
const app = new Application();
const port = parseInt(Deno.env.get("PORT") || "8000"); // Uses env var loaded above


// Basic middleware
app.use(oakCors({
  origin: Deno.env.get("FRONTEND_URL") || "http://localhost:3000",
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

// Mount Auth routes (assuming they are directly under /api, e.g., /api/login)
// If authRouter already includes /api or similar, adjust accordingly.
// For now, assuming authRouter defines routes like /login, /register
apiRouter.use(authRouter.routes());
apiRouter.use(authRouter.allowedMethods());

// Mount FatSecret Recipe routes under /api/fatsecret/recipes
apiRouter.use("/fatsecret/recipes", recipeRouter.routes(), recipeRouter.allowedMethods());

// Mount Workout routes (assuming under /api/workouts or similar)
// Adjust path as needed based on workoutRouter's definition
apiRouter.use("/workouts", workoutRouter.routes(), workoutRouter.allowedMethods());

// Register the main API router with the application
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

// --- Remove the old direct app.use calls for routers --- 
// app.use(authRouter.routes());         // REMOVED
// app.use(authRouter.allowedMethods()); // REMOVED
// app.use(recipeRouter.routes());       // REMOVED
// app.use(recipeRouter.allowedMethods());// REMOVED
// app.use(workoutRouter.routes());      // REMOVED
// app.use(workoutRouter.allowedMethods()); // REMOVED

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