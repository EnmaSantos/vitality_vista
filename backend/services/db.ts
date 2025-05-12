// backend/services/db.ts
import { loadEnv } from "../deps.ts"; // Import loadEnv
import { PostgresClient } from "../deps.ts"; // Keep existing import [cite: vitality_vista.zip/backend/deps.ts]

// Only try to load .env file in development environment, not in Deno Deploy
try {
  await loadEnv({ export: true });
} catch (error) {
  console.log("No .env file found, using environment variables from the system");
}

// Log environment variables for debugging


// --- Database Connection Configuration ---
// Retrieve connection details securely from environment variables
const dbHost = Deno.env.get("DB_HOST") || "localhost";
const dbPort = parseInt(Deno.env.get("DB_PORT") || "5432");
const dbUser = Deno.env.get("DB_USER");
const dbPassword = Deno.env.get("DB_PASSWORD");
const dbDatabase = Deno.env.get("DB_NAME");

// Basic validation (this should now pass if .env is loaded correctly)
if (!dbUser || !dbPassword || !dbDatabase) {
  console.error(
    "Error: Missing required database environment variables (DB_USER, DB_PASSWORD, DB_NAME)",
  );
  // Consider throwing an error here to stop execution if validation fails
  // throw new Error("Missing required database environment variables!");
}

// --- Create PostgreSQL Client Instance ---
// This should now receive the correct values from the loaded environment
const dbClient = new PostgresClient({
  hostname: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbDatabase,
  tls: {
    enabled: true,
    // If your database server uses a self-signed certificate or one not recognized
    // by default CA stores, you might need to set 'enforce' to false.
    // However, 'sslmode=require' usually means the server expects SSL, and
    // client-side certificate validation might still be enforced by the server or client defaults.
    // Start with just 'enabled: true'. If you get certificate errors, uncommenting
    // and setting 'enforce: false' might be necessary, but be aware of the security implications.
    // enforce: false, 
  },
});

// --- Connection Test Function ---
// (Keep the test function as corrected in the previous step)
async function testDbConnection() {
  try {
    console.log(`Attempting to connect to database "${dbDatabase}" on ${dbHost}:${dbPort}...`);
    await dbClient.connect();
    console.log("✅ Database connection pool established successfully!");
    // await dbClient.end(); // Optional: Uncomment only if you want the test to disconnect immediately.
  } catch (err) {
    console.error("❌ Database connection failed:");
    console.error(`   - Host: ${dbHost}:${dbPort}`);
    console.error(`   - Database: ${dbDatabase}`);
    console.error(`   - User: ${dbUser}`);
    console.error("   - Error:", err);
  }
}
testDbConnection(); // Call the test function

// --- Export the Client ---
export default dbClient;