// FILE: routes/routes.ts

import { Router, Context } from "../deps.ts";

const router = new Router();

router.get("/", (ctx: Context) => {
  ctx.response.body = "Welcome to the Vitality Vista API!";
});

export default router;