import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

const env = await load({ examplePath: null });
const databaseUrl = env["DATABASE_URL"] || Deno.env.get("DATABASE_URL");
const dbHost = env["DB_HOST"] || Deno.env.get("DB_HOST") || "localhost";
const dbPort = parseInt(env["DB_PORT"] || Deno.env.get("DB_PORT") || "5432");
const dbUser = env["DB_USER"] || Deno.env.get("DB_USER");
const dbPassword = env["DB_PASSWORD"] || Deno.env.get("DB_PASSWORD");
const dbDatabase = env["DB_NAME"] || Deno.env.get("DB_NAME");
const isProduction = (env["ENVIRONMENT"] || Deno.env.get("ENVIRONMENT")) === "production" ||
  !(env["ENVIRONMENT"] || Deno.env.get("ENVIRONMENT"));

if (!databaseUrl && (!dbUser || !dbPassword || !dbDatabase)) {
  console.error("Database configuration is not set. Provide DATABASE_URL or DB_USER, DB_PASSWORD, and DB_NAME.");
  Deno.exit(1);
}

const client = databaseUrl
  ? new Client(databaseUrl)
  : new Client({
    hostname: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbDatabase,
    tls: {
      enabled: true,
      enforce: isProduction,
    },
  });

async function runSetup() {
  await client.connect();
  try {
    console.log("Updating users table for Google auth...");
    const updateUsersForGoogleAuthQuery = `
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'password_hash'
        ) THEN
          ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'weight_kg'
        ) THEN
          ALTER TABLE users ALTER COLUMN weight_kg DROP NOT NULL;
        END IF;
      END $$;
    `;
    await client.queryArray(updateUsersForGoogleAuthQuery);

    console.log("Creating user_auth_identities table...");
    const createAuthIdentitiesTableQuery = `
      CREATE TABLE IF NOT EXISTS user_auth_identities (
        provider TEXT NOT NULL,
        provider_user_id TEXT NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (provider, provider_user_id)
      );
    `;
    await client.queryArray(createAuthIdentitiesTableQuery);

    console.log("Creating auth identities indexes...");
    const createAuthIdentitiesUserIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_user_auth_identities_user_id
        ON user_auth_identities(user_id);
    `;
    await client.queryArray(createAuthIdentitiesUserIndexQuery);

    const createAuthIdentitiesEmailIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_user_auth_identities_email
        ON user_auth_identities(email);
    `;
    await client.queryArray(createAuthIdentitiesEmailIndexQuery);

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
