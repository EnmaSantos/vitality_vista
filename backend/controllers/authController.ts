// backend/controllers/authController.ts
import { Context, createJwt, getNumericDate } from "../deps.ts"; // Import needed functions directly
import dbClient, { ensureConnection } from "../services/db.ts"; // Import the database client and ensureConnection
import { UserSchema, USER_TABLE_NAME } from "../models/user.model.ts"; // Import the schema and table name [cite: backend/models/user.model.ts]
import { hash, compare } from "../services/password.ts"; // Import hash and compare from our custom password service
import { verifyGoogleIdToken } from "../services/googleAuth.ts";
import type { VerifiedGoogleProfile } from "../services/googleAuth.ts";

// --- Interfaces (DTOs and API Response) ---
// UserSchema from user.model.ts now represents the DB/internal user structure

// API Response structure (remains camelCase for API consistency)
interface UserResponse {
  id: string;
  email: string;
  firstName: string | null; // Match nullability from schema
  lastName: string | null; // Match nullability from schema
}

// Data Transfer Object for registration payload
interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  weight: number;
}

// Data Transfer Object for login payload
interface LoginDTO {
  email: string;
  password: string;
}

interface GoogleLoginDTO {
  credential: string;
}

const AUTH_IDENTITIES_TABLE_NAME = "user_auth_identities";

// --- Helper Functions ---

// Takes UserSchema (snake_case from DB) and returns UserResponse (camelCase for API)
function sanitizeUser(user: UserSchema): UserResponse {
  // Map snake_case DB fields to camelCase API response fields
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name, // Map snake_case to camelCase
    lastName: user.last_name,   // Map snake_case to camelCase
  };
}

// Finds a user by email in the database
async function findUserByEmail(email: string): Promise<UserSchema | undefined> {
  try {
    const result = await dbClient.queryObject<UserSchema>(
      `SELECT * FROM ${USER_TABLE_NAME} WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    return result.rows[0]; // Returns the user object or undefined if not found
  } catch (dbError) {
    console.error("Error in findUserByEmail:", dbError);
    throw dbError; // Re-throw the error to be caught by the calling function
  }
}

async function findUserByGoogleSubject(providerUserId: string): Promise<UserSchema | undefined> {
  try {
    const result = await dbClient.queryObject<UserSchema>(
      `SELECT u.*
       FROM ${USER_TABLE_NAME} u
       INNER JOIN ${AUTH_IDENTITIES_TABLE_NAME} auth_identity
         ON auth_identity.user_id = u.id
       WHERE auth_identity.provider = 'google'
         AND auth_identity.provider_user_id = $1
       LIMIT 1`,
      [providerUserId],
    );
    return result.rows[0];
  } catch (dbError) {
    console.error("Error in findUserByGoogleSubject:", dbError);
    throw dbError;
  }
}

// Finds a user by ID in the database
async function findUserById(id: string): Promise<UserSchema | undefined> {
   try {
     const result = await dbClient.queryObject<UserSchema>(
       `SELECT * FROM ${USER_TABLE_NAME} WHERE id = $1 LIMIT 1`,
       [id],
     );
     return result.rows[0]; // Returns the user object or undefined if not found
   } catch (dbError) {
     console.error("Error in findUserById:", dbError);
     throw dbError;
   }
}

// Creates a new user in the database
async function createUser(data: RegisterDTO, passwordHash: string): Promise<UserSchema> {
  try {
    // Use INSERT ... RETURNING * to get the created user data back
    const result = await dbClient.queryObject<UserSchema>(
      `INSERT INTO ${USER_TABLE_NAME} (email, password_hash, first_name, last_name, weight_kg)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.email.toLowerCase(), passwordHash, data.firstName, data.lastName, data.weight],
    );
    // Assuming the insert was successful, return the first row (the new user)
    if (!result.rows[0]) {
       throw new Error("User creation failed, no data returned.");
    }
    return result.rows[0];
  } catch (dbError) {
     console.error("Error in createUser:", dbError);
     // Handle potential unique constraint violation (email already exists) more gracefully?
     // For now, just re-throw
     throw dbError;
  }
}

function getGoogleUserNames(profile: VerifiedGoogleProfile): { firstName: string; lastName: string } {
  const fallbackName = profile.name?.trim() || profile.email.split("@")[0];
  const [fallbackFirstName, ...fallbackLastNameParts] = fallbackName.split(/\s+/);

  return {
    firstName: profile.givenName?.trim() || fallbackFirstName || "Google",
    lastName: profile.familyName?.trim() || fallbackLastNameParts.join(" "),
  };
}

async function createGoogleUser(profile: VerifiedGoogleProfile): Promise<UserSchema> {
  try {
    const names = getGoogleUserNames(profile);
    const result = await dbClient.queryObject<UserSchema>(
      `INSERT INTO ${USER_TABLE_NAME} (email, password_hash, first_name, last_name)
       VALUES ($1, NULL, $2, $3)
       RETURNING *`,
      [profile.email, names.firstName, names.lastName],
    );

    if (!result.rows[0]) {
      throw new Error("Google user creation failed, no data returned.");
    }

    return result.rows[0];
  } catch (dbError) {
    console.error("Error in createGoogleUser:", dbError);
    throw dbError;
  }
}

async function linkGoogleIdentity(userId: string, profile: VerifiedGoogleProfile): Promise<void> {
  try {
    await dbClient.queryObject(
      `INSERT INTO ${AUTH_IDENTITIES_TABLE_NAME}
         (provider, provider_user_id, user_id, email)
       VALUES ('google', $1, $2, $3)
       ON CONFLICT (provider, provider_user_id)
       DO UPDATE SET
         user_id = EXCLUDED.user_id,
         email = EXCLUDED.email,
         updated_at = CURRENT_TIMESTAMP`,
      [profile.sub, userId, profile.email],
    );
  } catch (dbError) {
    console.error("Error in linkGoogleIdentity:", dbError);
    throw dbError;
  }
}

function sendAuthSuccess(ctx: Context, user: UserSchema, token: string, message: string, status = 200) {
  ctx.response.status = status;
  ctx.response.body = {
    success: true,
    message,
    data: {
      token,
      user: sanitizeUser(user),
    },
  };
}

// --- JWT Helper Functions (remain the same) ---
async function generateJwtKey(secret: string): Promise<CryptoKey> {
  // ... (implementation unchanged)
   const encoder = new TextEncoder();
   return await crypto.subtle.importKey(
       "raw",
       encoder.encode(secret),
       { name: "HMAC", hash: "SHA-512" },
       false,
       ["sign", "verify"]
   );
}

async function generateToken(userId: string): Promise<string> {
  // ... (implementation unchanged)
   const jwtSecret = Deno.env.get("JWT_SECRET") || "";
   const key = await generateJwtKey(jwtSecret);
   
   return await createJwt(
       { alg: "HS512", typ: "JWT" },
       { 
           sub: userId,
           exp: getNumericDate(60 * 60 * 24), // 24 hours
           iat: getNumericDate(0)
       },
       key
   );
}

// --- Route Handlers (Refactored) ---

// Register a new user
export async function register(ctx: Context) {
  try {
    // Ensure database connection is alive
    await ensureConnection();
    
    const result = ctx.request.body({ type: "json" });
    const body: RegisterDTO = await result.value;

    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.weight) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Missing required fields" };
      return;
    }

    // Check if user already exists (now async)
    const existingUser = await findUserByEmail(body.email);
    if (existingUser) {
      ctx.response.status = 400; // Changed from 400 to 409 Conflict might be better
      ctx.response.body = { success: false, message: "User with this email already exists" };
      return;
    }

    // Hash password using scrypt instead of bcrypt
    const passwordHash = await hash(body.password);

    // Create new user in DB (now async)
    const newUser = await createUser(body, passwordHash); // newUser is now UserSchema

    // Generate JWT token
    const token = await generateToken(newUser.id); // Use ID from the created user

    sendAuthSuccess(ctx, newUser, token, "User registered successfully", 201);
  } catch (error: unknown) {
    console.error("Registration error:", error); // Log the actual error
    // Handle specific DB errors like unique constraint violation if needed
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error during registration",
      // Avoid sending detailed error messages to the client in production
      error: (error instanceof Error) ? error.message : "Unknown error",
    };
  }
}

// Login user
export async function login(ctx: Context) {
  try {
    // Ensure database connection is alive
    await ensureConnection();
    
    const result = ctx.request.body({ type: "json" });
    const body: LoginDTO = await result.value;

    if (!body.email || !body.password) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Email and password are required" };
      return;
    }

    // Find user (now async)
    const user = await findUserByEmail(body.email); // user is UserSchema | undefined
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Invalid credentials" };
      return;
    }

    if (!user.password_hash) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Invalid credentials" };
      return;
    }

    // Check password using scrypt compare instead of bcrypt
    const isPasswordValid = await compare(body.password, user.password_hash);
    if (!isPasswordValid) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Invalid credentials" };
      return;
    }

    // Generate JWT token
    const token = await generateToken(user.id);

    sendAuthSuccess(ctx, user, token, "Login successful");
  } catch (error) {
    console.error("Login error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error during login",
      error: (error instanceof Error) ? error.message : "Unknown error",
    };
  }
}

export async function googleLogin(ctx: Context) {
  try {
    await ensureConnection();

    const result = ctx.request.body({ type: "json" });
    const body: GoogleLoginDTO = await result.value;

    if (!body.credential) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Google credential is required" };
      return;
    }

    const googleProfile = await verifyGoogleIdToken(body.credential);
    let user = await findUserByGoogleSubject(googleProfile.sub);

    if (!user) {
      user = await findUserByEmail(googleProfile.email);

      if (user) {
        await linkGoogleIdentity(user.id, googleProfile);
      } else {
        user = await createGoogleUser(googleProfile);
        await linkGoogleIdentity(user.id, googleProfile);
      }
    }

    const token = await generateToken(user.id);
    sendAuthSuccess(ctx, user, token, "Google login successful");
  } catch (error) {
    console.error("Google login error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const isConfigError = message === "Google auth is not configured";

    ctx.response.status = isConfigError ? 500 : 401;
    ctx.response.body = {
      success: false,
      message: isConfigError ? "Google login is not configured" : "Google login failed",
      error: message,
    };
  }
}

// Get current user profile (now async)
export async function getCurrentUser(ctx: Context) { // Mark as async
  try {
    const userId = ctx.state.userId; // Set by authMiddleware

    // Find the user by ID (now async)
    const user = await findUserById(userId); // user is UserSchema | undefined

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, message: "User not found" };
      return;
    }

    // Generate a new token to refresh the user's session
    const token = await generateToken(user.id);

    // Return success response with user data and the new token
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "User profile retrieved successfully",
      data: {
        token, // Send the refreshed token back
        user: sanitizeUser(user),
      },
    };
  } catch (error) {
    console.error("Get current user error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error retrieving user profile",
      error: (error instanceof Error) ? error.message : "Unknown error",
    };
  }
}

// Logout user
export async function logoutUser(ctx: Context) {
  try {
    // Standard way to clear a cookie is to set it with an expiration date in the past.
    // The name 'jwt' is assumed here; adjust if your token cookie has a different name.
    ctx.cookies.delete("jwt", { path: "/" }); // Ensure path matches how it was set
    // For httpOnly cookies, you might also need to specify domain and secure attributes
    // if they were used when setting the cookie.
    // Example: ctx.cookies.delete("jwt", { path: "/", domain: "yourdomain.com", secure: true, httpOnly: true });

    ctx.response.status = 200;
    ctx.response.body = { success: true, message: "Logout successful" };
  } catch (error) {
    console.error("Logout error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error during logout",
      error: (error instanceof Error) ? error.message : "Unknown error",
    };
  }
}
