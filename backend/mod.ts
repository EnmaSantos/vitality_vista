// FILE: mod.ts

import { Application } from "./deps.ts";
import router from "./routes/routes.ts"; // We'll create this next
import { config } from "./deps.ts";

// Load environment variables
config({ export: true });

// Create a new Oak application
const app = new Application();

// Use the router
app.use(router.routes());
app.use(router.allowedMethods());

// Start listening on port 8000
const PORT = 8000;
console.log(`Server is running on http://localhost:${PORT}`);
await app.listen({ port: PORT });