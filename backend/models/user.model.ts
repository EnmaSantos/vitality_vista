// backend/models/user.model.ts

/**
 * Represents the structure of a user record in the PostgreSQL database table.
 * Note: This interface defines the shape for TypeScript.
 * The actual database table needs to be created separately with corresponding SQL types.
 */
export interface UserSchema {
    id: string; // In PostgreSQL, likely type: UUID (primary key) or SERIAL/BIGSERIAL
    email: string; // In PostgreSQL, likely type: VARCHAR(255) or TEXT, UNIQUE, NOT NULL
    password_hash: string; // In PostgreSQL, likely type: TEXT or VARCHAR, NOT NULL (renamed from passwordHash for SQL convention)
    first_name: string; // In PostgreSQL, likely type: VARCHAR(100) or TEXT (renamed from firstName)
    last_name: string; // In PostgreSQL, likely type: VARCHAR(100) or TEXT (renamed from lastName)
    created_at: Date; // In PostgreSQL, likely type: TIMESTAMPTZ DEFAULT NOW() NOT NULL
    updated_at: Date; // In PostgreSQL, likely type: TIMESTAMPTZ DEFAULT NOW() NOT NULL
    // We can add fitness-specific fields later as mentioned in next-steps.md [cite: vitality_vista.zip/next-steps.md]
    // e.g., weight_kg?: number; height_cm?: number; goal?: string; etc.
  }
  
  // Optional: Define the table name as a constant
  export const USER_TABLE_NAME = "users";