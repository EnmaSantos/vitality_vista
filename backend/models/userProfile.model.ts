/**
 * Represents the structure of the user_profiles table in the database.
 */
export interface UserProfileSchema {
  user_id: string; // Foreign Key referencing users(id)
  date_of_birth?: string | null; // Store as ISO string (YYYY-MM-DD) or Date
  height_cm?: number | null;
  weight_kg?: number | null;
  gender?: string | null;
  activity_level?: string | null;
  fitness_goals?: string | null;
  dietary_restrictions?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export const USER_PROFILES_TABLE_NAME = "user_profiles"; 