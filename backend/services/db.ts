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

// Check if a direct connection string is provided (preferred for production)
const connectionString = Deno.env.get("DATABASE_URL");

// Determine if we're in production or development
const isProduction = Deno.env.get("ENVIRONMENT") === "production" || 
                    !Deno.env.get("ENVIRONMENT"); // Default to production if not specified

// --- Create PostgreSQL Client Instance ---
let dbClient: PostgresClient;

if (connectionString) {
  // Use the complete connection string if available
  console.log("Using database connection string (DATABASE_URL)");
  dbClient = new PostgresClient(connectionString);
} else {
  // Build connection details from individual environment variables
  console.log("Building database connection from individual parameters");
  dbClient = new PostgresClient({
    hostname: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbDatabase,
    // Use application_name to identify your app in database logs
    applicationName: "vitality_vista_api",
    // Add necessary SSL params for Neon and other PostgreSQL providers
    tls: {
      enabled: true,
      // In production, we need to enforce SSL
      // In development, we can be more lenient
      enforce: isProduction,
    },
  });
}

// --- Connection Test Function ---
// (Keep the test function as corrected in the previous step)
async function testDbConnection() {
  try {
    console.log(`Attempting to connect to database...`);
    if (!connectionString) {
      console.log(`- Server: ${dbHost}:${dbPort}`);
      console.log(`- Database: ${dbDatabase}`);
      console.log(`- SSL mode: ${isProduction ? 'enforced (production)' : 'optional (development)'}`);
    } else {
      console.log("- Using connection string (details masked)"); 
    }
    await dbClient.connect();
    console.log("✅ Database connection pool established successfully!");
    // await dbClient.end(); // Optional: Uncomment only if you want the test to disconnect immediately.
  } catch (err) {
    console.error("❌ Database connection failed:");
    if (!connectionString) {
      console.error(`   - Host: ${dbHost}:${dbPort}`);
      console.error(`   - Database: ${dbDatabase}`);
      console.error(`   - User: ${dbUser}`);
    } else {
      console.error("   - Using connection string (details masked)");
    }
    console.error("   - Error:", err);
  }
}
testDbConnection(); // Call the test function

// --- Export the Client ---
export default dbClient;