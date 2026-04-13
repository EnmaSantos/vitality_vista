// middleware/authMiddleware.ts
// AUTH BYPASS: design-no-auth branch — replace MOCK_USER_ID with a real UUID from your users table
import { Context } from "../deps.ts";

const MOCK_USER_ID = Deno.env.get("MOCK_USER_ID") || "00000000-0000-0000-0000-000000000000";

export async function authMiddleware(ctx: Context, next: () => Promise<unknown>) {
  ctx.state.userId = MOCK_USER_ID;
  await next();
}