// backend/models/logExerciseDetail.model.ts

/**
 * Represents the structure of the log_exercise_details table in the database.
 */
export interface LogExerciseDetailSchema {
    log_exercise_id: number; // Corresponds to SERIAL PRIMARY KEY
    log_id: number;          // Corresponds to INTEGER NOT NULL REFERENCES workout_logs(log_id)
    exercise_id: number;     // Corresponds to INTEGER NOT NULL (Exercise API ID)
    exercise_name: string;   // Corresponds to VARCHAR(255) NOT NULL
    order_in_log: number;    // Corresponds to INTEGER NOT NULL
    set_number: number;      // Corresponds to INTEGER NOT NULL
    reps_achieved: number | null; // Corresponds to INTEGER (nullable)
    weight_kg_used: number | null; // Corresponds to NUMERIC(6, 2) (nullable)
    duration_achieved_seconds: number | null; // Corresponds to INTEGER (nullable)
    calories_burned: number | null; // Corresponds to INTEGER (nullable) - Calculated MET-based calories
    notes: string | null;      // Corresponds to TEXT (nullable)
  }