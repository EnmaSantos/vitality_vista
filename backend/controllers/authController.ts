// backend/controllers/authController.ts
import { Context, bcrypt, createJwt, getNumericDate } from "../deps.ts"; [cite: vitality_vista.zip/backend/deps.ts]
import dbClient from "../services/db.ts"; // Import the database client [cite: vitality_vista.zip/backend/services/db.ts]
import { UserSchema, USER_TABLE_NAME } from "../models/user.model.ts"; // Import the schema and table name [cite: backend/models/user.model.ts]

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
}

// Data Transfer Object for login payload
interface LoginDTO {
  email: string;
  password: string;
}

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
      `SELECT * FROM ${USER_TABLE_NAME} WHERE email = $1 LIMIT 1`,
      [email],
    );
    return result.rows[0]; // Returns the user object or undefined if not found
  } catch (dbError) {
    console.error("Error in findUserByEmail:", dbError);
    throw dbError; // Re-throw the error to be caught by the calling function
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
      `INSERT INTO ${USER_TABLE_NAME} (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.email, passwordHash, data.firstName, data.lastName],
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
    const result = ctx.request.body({ type: "json" });
    const body: RegisterDTO = await result.value;

    if (!body.email || !body.password || !body.firstName || !body.lastName) {
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(body.password, salt);

    // Create new user in DB (now async)
    const newUser = await createUser(body, passwordHash); // newUser is now UserSchema

    // Generate JWT token
    const token = await generateToken(newUser.id); // Use ID from the created user

    // Return success response (sanitizeUser now expects UserSchema)
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: sanitizeUser(newUser), // Pass UserSchema to sanitizeUser
      },
    };
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

    // Check password (use user.password_hash from UserSchema)
    const isPasswordValid = await bcrypt.compare(body.password, user.password_hash);
    if (!isPasswordValid) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Invalid credentials" };
      return;
    }

    // Generate JWT token
    const token = await generateToken(user.id);

    // Return success response (sanitizeUser now expects UserSchema)
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Login successful",
      data: {
        token,
        user: sanitizeUser(user), // Pass UserSchema to sanitizeUser
      },
    };
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

    // Return user data (sanitizeUser now expects UserSchema)
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: sanitizeUser(user), // Pass UserSchema to sanitizeUser
    };
  } catch (error) {
    console.error("Get current user error:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error fetching user profile",
      error: (error instanceof Error) ? error.message : "Unknown error",
    };
  }
}