import { MongoClient, Database } from "../deps.ts";
import { load } from "../deps.ts";

await load({ export: true });

let db: Database;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    try {
      const client = new MongoClient();
      const mongoUri = Deno.env.get("MONGODB_URI");
      
      if (!mongoUri) {
        throw new Error("MONGODB_URI is not defined in the environment variables");
      }

      console.log("Attempting to connect to MongoDB...");

      await client.connect(mongoUri);
      console.log("Successfully connected to MongoDB");
      db = client.database("vitalityVista");
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  }
  return db;
}