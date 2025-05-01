// backend/models/workoutLog.model.ts

/**
 * Represents the structure of the workout_logs table in the database.
 */
export interface WorkoutLogSchema {
    log_id: number;         // Corresponds to SERIAL PRIMARY KEY
    user_id: string;        // Corresponds to UUID NOT NULL REFERENCES users(id)
    plan_id: number | null; // Corresponds to INTEGER REFERENCES workout_plans(plan_id) (nullable)
    log_date: Date | string; // Corresponds to TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    duration_minutes: number | null; // Corresponds to INTEGER (nullable)
    notes: string | null;     // Corresponds to TEXT (nullable)
    created_at: Date | string; // Corresponds to TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  }