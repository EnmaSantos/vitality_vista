// controllers/authController.ts
import { Context, bcrypt, createJwt, getNumericDate } from "../deps.ts";

// User interfaces
interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginDTO {
  email: string;
  password: string;
}

// Temporary in-memory storage for users
const users: User[] = [];

// Helper functions
function sanitizeUser(user: User): UserResponse {
  const { id, email, firstName, lastName } = user;
  return { id, email, firstName, lastName };
}

function findUserByEmail(email: string): User | undefined {
  return users.find(user => user.email === email);
}

function findUserById(id: string): User | undefined {
  return users.find(user => user.id === id);
}

function createUser(data: RegisterDTO, passwordHash: string): User {
  const newUser: User = {
    id: crypto.randomUUID(),
    email: data.email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  users.push(newUser);
  return newUser;
}

// JWT helper function
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

// Token generation function
async function generateToken(userId: string): Promise<string> {
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

// Register a new user
export async function register(ctx: Context) {
  try {
    // Parse request body
    const result = ctx.request.body({ type: "json" });
    const body: RegisterDTO = await result.value;
    
    // Basic validation
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      ctx.response.status = 400;
      ctx.response.body = { 
        success: false, 
        message: "Missing required fields" 
      };
      return;
    }
    
    // Check if user already exists
    const existingUser = findUserByEmail(body.email);
    if (existingUser) {
      ctx.response.status = 400;
      ctx.response.body = { 
        success: false, 
        message: "User with this email already exists" 
      };
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(body.password, salt);
    
    // Create new user
    const newUser = createUser(body, passwordHash);
    
    // Generate JWT token
    const token = await generateToken(newUser.id);
    
    // Return success response
    ctx.response.status = 201;
    ctx.response.body = { 
      success: true, 
      message: "User registered successfully",
      data: {
        token,
        user: sanitizeUser(newUser)
      }
    };
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = { 
      success: false, 
      message: "Server error during registration",
      error: (error as Error).message
    };
  }
}

// Login user
export async function login(ctx: Context) {
  try {
    // Parse request body
    const result = ctx.request.body({ type: "json" });
    const body: LoginDTO = await result.value;
    
    // Basic validation
    if (!body.email || !body.password) {
      ctx.response.status = 400;
      ctx.response.body = { 
        success: false, 
        message: "Email and password are required" 
      };
      return;
    }
    
    // Find user
    const user = findUserByEmail(body.email);
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = { 
        success: false, 
        message: "Invalid credentials" 
      };
      return;
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!isPasswordValid) {
      ctx.response.status = 401;
      ctx.response.body = { 
        success: false, 
        message: "Invalid credentials" 
      };
      return;
    }
    
    // Generate JWT token
    const token = await generateToken(user.id);
    
    // Return success response
    ctx.response.status = 200;
    ctx.response.body = { 
      success: true, 
      message: "Login successful",
      data: {
        token,
        user: sanitizeUser(user)
      }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { 
      success: false, 
      message: "Server error during login",
      error: (error as Error).message
    };
  }
}

// Get current user profile
export async function getCurrentUser(ctx: Context) {
  try {
    // The user ID will be set by the authMiddleware
    const userId = ctx.state.userId;
    
    // Find the user by ID
    const user = findUserById(userId);
    
    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = { 
        success: false, 
        message: "User not found" 
      };
      return;
    }
    
    ctx.response.status = 200;
    ctx.response.body = { 
      success: true, 
      data: sanitizeUser(user)
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { 
      success: false, 
      message: "Server error fetching user profile",
      error: (error as Error).message
    };
  }
}