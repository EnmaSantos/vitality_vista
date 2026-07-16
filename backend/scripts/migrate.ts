import dbClient from "../services/db.ts";

const migrationsUrl = new URL("../migrations/", import.meta.url);
const migrations: string[] = [];

for await (const entry of Deno.readDir(migrationsUrl)) {
  if (entry.isFile && /^\d+_[a-z0-9_]+\.sql$/.test(entry.name)) {
    migrations.push(entry.name);
  }
}

migrations.sort();
await dbClient.connect();

try {
  await dbClient.queryArray(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const migration of migrations) {
    const applied = await dbClient.queryObject<{ version: string }>(
      "SELECT version FROM schema_migrations WHERE version = $1",
      [migration],
    );
    if (applied.rows.length > 0) {
      console.log(`Already applied: ${migration}`);
      continue;
    }

    const sql = await Deno.readTextFile(new URL(migration, migrationsUrl));
    console.log(`Applying: ${migration}`);
    await dbClient.queryArray("BEGIN");
    try {
      await dbClient.queryArray(sql);
      await dbClient.queryArray(
        "INSERT INTO schema_migrations (version) VALUES ($1)",
        [migration],
      );
      await dbClient.queryArray("COMMIT");
    } catch (error) {
      await dbClient.queryArray("ROLLBACK");
      throw error;
    }
  }

  console.log("Database migrations are up to date.");
} finally {
  await dbClient.end();
}
