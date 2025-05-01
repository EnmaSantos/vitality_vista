// server.ts
import { Application, oakCors, loadEnv, Router as _Router } from "./deps.ts";

// Load environment variables for the server itself (e.g., PORT)
await loadEnv({ export: true });

// Remove the temporary import for db.ts - it's no longer needed here
// import "./services/db.ts"; // <-- REMOVE OR COMMENT OUT THIS LINE
import "./services/db.ts";
// Import routers
import authRouter from "./routes/auth.ts";
import recipeRouter from "./routes/recipes.ts"; // <-- ADD THIS IMPORT
import foodRouter from "./routes/food.ts"; // <-- ADD THIS IMPORT
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

// Use the imported authRouter
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

// Use the recipe routes <-- ADD THESE LINES
app.use(recipeRouter.routes());
app.use(recipeRouter.allowedMethods());

// Use the food routes <-- ADD THESE LINES
app.use(foodRouter.routes());
app.use(foodRouter.allowedMethods());

// Use the workout routes <-- ADD THESE LINES
app.use(workoutRouter.routes());
app.use(workoutRouter.allowedMethods());

// Default route
app.use((ctx) => {
  ctx.response.body = {
    success: true,
    message: "Welcome to Vitality Vista API",
    timestamp: new Date().toISOString(),
  };
});

// Start the server
console.log(`🚀 Server running on http://localhost:${port}`);
await app.listen({ port });