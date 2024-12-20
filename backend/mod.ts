// Importing modules from deps.ts
import { Application, Router } from "./deps.ts";

await load({export: true});

const app = new Application();
const router = new Router();

router.get("/", (context) => {
  context.response.body = "Hello, Oak!";
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = 8000;
console.log(`Server running on http://localhost:${port}`);
await app.listen({ port });