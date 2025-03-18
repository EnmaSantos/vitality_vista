// server.ts
import { Application, oakCors, loadEnv, Router } from "./deps.ts";

// Load environment variables
await loadEnv({ export: true });

// Initialize the app
const app = new Application();
const port = parseInt(Deno.env.get("PORT") || "8000");

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

// Import routers (we'll create these next)
import authRouter from "./routes/auth.ts";
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

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