// middleware/authMiddleware.ts
import { Context, verifyJwt } from "../deps.ts";

// Same JWT key generation function as in the controller
async function generateJwtKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign", "verify"]
  );
}

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
    const jwtSecret = Deno.env.get("JWT_SECRET") || "";
    
    // Generate the key exactly the same way as in the controller
    const key = await generateJwtKey(jwtSecret);
    
    try {
      // Verify the token
      const payload = await verifyJwt(token, key);
      
      // Check if the token has a subject (user ID)
      if (!payload || !payload.sub) {
        ctx.response.status = 401;
        ctx.response.body = { 
          success: false, 
          message: "Invalid token payload" 
        };
        return;
      }
      
      // Set the user ID in the context state for controllers to use
      ctx.state.userId = payload.sub;
      
      // Continue to the next middleware or route handler
      await next();
    } catch (verifyError) {
      ctx.response.status = 401;
      ctx.response.body = { 
        success: false, 
        message: "Token verification failed",
        error: (verifyError as Error).message
      };
    }
  } catch (error) {
    ctx.response.status = 401;
    ctx.response.body = { 
      success: false, 
      message: "Authentication failed",
      error: (error as Error).message
    };
  }
}