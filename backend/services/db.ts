// FILE: services/db.ts

import { MongoClient, Database, load } from "../deps.ts";

// Load environment variables
const env = await load();

// Get MongoDB URI from the `env` object
const MONGODB_URI = env["MONGODB_URI"];

// Handle missing URI
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in the environment variables");
}

// Create MongoDB client
const client = new MongoClient();

// Declare `db` with the correct type
let db: Database;

try {
  // Connect to MongoDB
  await client.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully ✨");

  // Get database instance
  db = client.database("vitalityVista");

  // Test operation: List collections
  const collections = await db.listCollectionNames();
  console.log("Collections in the database:", collections);
} catch (err) {
  console.error("Error connecting to MongoDB:", err);
  throw err; // Re-throw the error after logging
}

// Export the `db` instance
export default db;