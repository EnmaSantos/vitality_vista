// middleware/authMiddleware.ts
import { Context, verifyJwt } from "../deps.ts";

export async function authMiddleware(ctx: Context, next: () => Promise<unknown>) {
  try {
    // Get the authorization header
    const authHeader = ctx.request.headers.get("Authorization");
    
    if (!authHeader) {
      ctx.response.status = 401;
      ctx.response.body = { 
        success: false, 
        message: "Authorization header missing" 
      };
      return;
    }
    
    // Check for Bearer token
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match || !match[1]) {
      ctx.response.status = 401;
      ctx.response.body = { 
        success: false, 
        message: "Invalid token format" 
      };
      return;
    }
    
    // Get the JWT
    const token = match[1];
    
    // Verify the JWT
    const jwtSecret = Deno.env.get("JWT_SECRET") || "your-default-secret-change-this";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign", "verify"],
    );
    const payload = await verifyJwt(token, key);
    
    // Check if the token has a subject (user ID)
    if (!payload || !payload.sub) {
      ctx.response.status = 401;
      ctx.response.body = { 
        success: false, 
        message: "Invalid token" 
      };
      return;
    }
    
    // Set the user ID in the context state for controllers to use
    ctx.state.userId = payload.sub;
    
    // Continue to the next middleware or route handler
    await next();
  } catch (error) {
    // JWT verification error
    ctx.response.status = 401;
    ctx.response.body = { 
      success: false, 
      message: "Invalid or expired token",
      error: (error as Error).message
    };
  }
}