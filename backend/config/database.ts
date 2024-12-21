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

      // Connect with explicit options
      await client.connect({
        db: "vitalityVista",
        tls: true,
        servers: [{
          host: "cluster0.89dxp.mongodb.net",
          port: 27017
        }],
        credential: {
          username: "del20047",
          password: "Eldor488",
          db: "admin",
          mechanism: "SCRAM-SHA-1"
        }
      });
      
      console.log("Successfully connected to MongoDB");
      db = client.database("vitalityVista");
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  }
  return db;
}