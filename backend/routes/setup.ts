import { Router } from "../deps.ts";
import dbClient from "../services/db.ts";

const setupRouter = new Router();

// GET /api/setup-db/water
// Run SQL to create water_logs table
setupRouter.get("/water", async (ctx) => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS water_logs (
        log_id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount_ml INTEGER NOT NULL,
        log_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await dbClient.queryArray(createTableQuery);

    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, log_date);
    `;
    await dbClient.queryArray(createIndexQuery);

    ctx.response.body = { success: true, message: "Water logs table created successfully." };
  } catch (error) {
    console.error("Setup error:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});

export default setupRouter;
