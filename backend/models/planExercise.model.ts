// backend/models/planExercise.model.ts

/**
 * Represents the structure of the plan_exercises table in the database.
 */
export interface PlanExerciseSchema {
    plan_exercise_id: number; // Corresponds to SERIAL PRIMARY KEY
    plan_id: number;        // Corresponds to INTEGER NOT NULL REFERENCES workout_plans(plan_id)
    exercise_id: number;    // Corresponds to INTEGER NOT NULL (Exercise API ID)
    exercise_name: string;  // Corresponds to VARCHAR(255) NOT NULL
    order_in_plan: number;  // Corresponds to INTEGER NOT NULL
    sets: number | null;      // Corresponds to INTEGER (nullable)
    reps: string | null;      // Corresponds to VARCHAR(50) (nullable)
    weight_kg: number | null; // Corresponds to NUMERIC(6, 2) (nullable)
    duration_minutes: number | null; // Corresponds to INTEGER (nullable)
    rest_period_seconds: number | null; // Corresponds to INTEGER (nullable)
    notes: string | null;     // Corresponds to TEXT (nullable)
  }