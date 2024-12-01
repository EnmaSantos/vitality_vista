// FILE: routes/routes.ts

import { Router, Context } from "../deps.ts";
import db from "../services/db.ts";

const router = new Router();

router.get("/", (ctx: Context) => {
  ctx.response.body = "Welcome to Vitality Vista API";
});

// Test database connection by fetching collections
router.get("/test-db", async (ctx: Context) => {
  try {
    const collections = await db.listCollectionNames();
    ctx.response.body = {
      message: "Connected to MongoDB successfully",
      collections,
    };
  } catch (err) {
    // Use a type guard to check if `err` is an instance of `Error`
    if (err instanceof Error) {
      ctx.response.status = 500;
      ctx.response.body = { message: "Failed to connect to MongoDB", error: err.message };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { message: "Failed to connect to MongoDB", error: "Unknown error" };
    }
  }
});

export default router;