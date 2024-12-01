// FILE: mod.ts

import { Application } from "./deps.ts";
import router from "./routes/routes.ts";
import { load } from "./deps.ts";

// Load environment variables
await load({ export: true });

// Create router
const app = new Application();

// Use router
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const port = 8000;
console.log(`Server running on http://localhost:${port}`);
console.log(`Connection successful ✌️✨`);
console.log(`Press Ctrl+C to stop the server`);
await app.listen({ port });