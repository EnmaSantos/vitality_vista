import { MongoClient } from "./deps.ts";
import { load } from "./deps.ts";

await load({ export: true });

const mongoUri = Deno.env.get("MONGODB_URI");
if (!mongoUri) {
  throw new Error("MONGODB_URI is not defined in the environment variables");
}

const client = new MongoClient();

try {
  console.log("Attempting to connect to MongoDB...");
  console.log("Using MONGODB_URI:", mongoUri);
  await client.connect(mongoUri);
  console.log("Connected to MongoDB successfully!");
} catch (error) {
  console.error("Failed to connect to MongoDB:", error);
}