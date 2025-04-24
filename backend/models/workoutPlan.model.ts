// backend/models/workoutPlan.model.ts

/**
 * Represents the structure of the workout_plans table in the database.
 */
export interface WorkoutPlanSchema {
    plan_id: number;        // Corresponds to SERIAL PRIMARY KEY
    user_id: string;        // Corresponds to UUID NOT NULL REFERENCES users(id)
    name: string;           // Corresponds to VARCHAR(255) NOT NULL
    description: string | null; // Corresponds to TEXT (nullable)
    created_at: Date | string; // Corresponds to TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    updated_at: Date | string; // Corresponds to TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  }

  