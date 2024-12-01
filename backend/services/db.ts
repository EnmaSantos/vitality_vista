// FILE: services/db.ts

import { MongoClient, config } from "../deps.ts";

// Load environment variables
config({ export: true });

// Get the MongoDB URI from environment variables
const MONGODB_URI = Deno.env.get("MONGODB_URI");

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in the environment variables");
}

// Create a new MongoClient
const client = new MongoClient();

// Connect to the MongoDB server
await client.connect(MONGODB_URI);

// Select the database (will be created if it doesn't exist)
const db = client.database("vitalityVista");

// Export the database object for use in other modules
export default db;