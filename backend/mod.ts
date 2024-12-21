// Importing modules from deps.ts
import { Application, Router } from "./deps.ts";
import { getDatabase } from "./config/database.ts";
// Load environment variables
import { load } from "./deps.ts";

// Load environment variables
const env = await load();

// Use a default port or from the .env file
const port = env.PORT ? Number(env.PORT) : 8000; // Default to 8000 if PORT is not set in .env

const app = new Application();
const router = new Router();

// Initialize the database connection
const _db = await getDatabase();

router.get("/", (context) => {
  context.response.body = "Hello, Oak!";
});

app.use(router.routes());
app.use(router.allowedMethods());


console.log(`Server running on http://localhost:${port}`);
await app.listen({ port });