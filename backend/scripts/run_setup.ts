import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

const env = await load();
const databaseUrl = env["DATABASE_URL"] || Deno.env.get("DATABASE_URL");

if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  Deno.exit(1);
}

const client = new Client(databaseUrl);

async function runSetup() {
  await client.connect();
  try {
    console.log("Creating water_logs table...");
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS water_logs (
        log_id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount_ml INTEGER NOT NULL,
        log_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.queryArray(createTableQuery);

    console.log("Creating index...");
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, log_date);
    `;
    await client.queryArray(createIndexQuery);

    console.log("Creating daily_goals table...");
    const createGoalsTableQuery = `
      CREATE TABLE IF NOT EXISTS daily_goals (
        goal_id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        goal_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.queryArray(createGoalsTableQuery);

    console.log("Creating goals index...");
    const createGoalsIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON daily_goals(user_id, goal_date);
    `;
    await client.queryArray(createGoalsIndexQuery);

    console.log("Setup completed successfully.");
  } catch (err) {
    console.error("Error running setup:", err);
  } finally {
    await client.end();
  }
}

runSetup();
