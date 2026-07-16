// middleware/authMiddleware.ts
import { Context, verifyJwt } from "../deps.ts";
import { jwtKey } from "../utils/jwt.ts";

export async function authMiddleware(
  ctx: Context,
  next: () => Promise<unknown>,
) {
  try {
    // Get the authorization header
    const authHeader = ctx.request.headers.get("Authorization");

    if (!authHeader) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Authorization header missing",
      };
      return;
    }

    // Check for Bearer token
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match || !match[1]) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Invalid token format",
      };
      return;
    }

    // Get the JWT
    const token = match[1];

    try {
      // Verify the token
      const payload = await verifyJwt(token, jwtKey);

      // Check if the token has a subject (user ID)
      if (!payload || !payload.sub) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          message: "Invalid token payload",
        };
        return;
      }

      // Set the user ID in the context state for controllers to use
      ctx.state.userId = payload.sub;

      // Continue to the next middleware or route handler
      await next();
    } catch (verifyError) {
      console.warn("JWT verification failed:", verifyError);
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Invalid or expired token",
      };
    }
  } catch (error) {
    console.error("Authentication middleware failed:", error);
    ctx.response.status = 401;
    ctx.response.body = {
      success: false,
      message: "Authentication failed",
    };
  }
}
