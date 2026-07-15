import dbClient from "../services/db.ts";
import { hash } from "../services/password.ts";

const email = Deno.env.get("DEMO_EMAIL") ?? "demo@vitalityvista.local";
const password = Deno.env.get("DEMO_PASSWORD") ?? "VitalityDemo123!";
const passwordHash = await hash(password);
const userId = "00000000-0000-4000-8000-000000000001";

await dbClient.connect();
try {
  await dbClient.queryArray("BEGIN");
  await dbClient.queryArray(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, weight_kg)
     VALUES ($1, $2, $3, 'Demo', 'User', 72.5)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = CURRENT_TIMESTAMP`,
    [userId, email.toLowerCase(), passwordHash],
  );
  await dbClient.queryArray(
    `INSERT INTO user_profiles (user_id, height_cm, weight_kg, activity_level, fitness_goals)
     SELECT id, 175, 72.5, 'moderately_active', 'Improve consistency'
     FROM users WHERE email = $1
     ON CONFLICT (user_id) DO NOTHING`,
    [email.toLowerCase()],
  );
  await dbClient.queryArray("COMMIT");
  console.log(`Seeded demo user: ${email}`);
} catch (error) {
  await dbClient.queryArray("ROLLBACK");
  throw error;
} finally {
  await dbClient.end();
}
