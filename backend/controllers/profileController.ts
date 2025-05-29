import { Context } from "../deps.ts";
import dbClient from "../services/db.ts";
import { UserProfileSchema, USER_PROFILES_TABLE_NAME } from "../models/userProfile.model.ts";
import { calculateMetabolicData } from "../services/metabolicService.ts";

// Payload for updating user profile
interface UpdateUserProfileDTO {
  date_of_birth?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  gender?: string | null;
  activity_level?: string | null;
  fitness_goals?: string | null;
  dietary_restrictions?: string | null;
}

// Extended response interface that includes calculated metabolic data
interface UserProfileResponse extends UserProfileSchema {
  age?: number | null;
  bmr?: number | null;
  tdee?: number | null;
}

/**
 * Handles GET /api/users/me/profile
 * Retrieves the profile for the authenticated user.
 */
export async function getUserProfileHandler(ctx: Context) {
  try {
    const userId = ctx.state.userId as string | undefined;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "User not authenticated" };
      return;
    }

    const result = await dbClient.queryObject<UserProfileSchema>(
      `SELECT user_id, date_of_birth, height_cm, weight_kg, gender, activity_level, fitness_goals, dietary_restrictions, created_at, updated_at
       FROM ${USER_PROFILES_TABLE_NAME}
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // No profile found, return an empty object or default structure
      ctx.response.status = 200; // Or 404 if you prefer to indicate not found explicitly
      ctx.response.body = {
        success: true,
        message: "User profile not yet created.", // Or simply "User profile found" and return empty data
        data: { user_id: userId }, // Return at least user_id
      };
      return;
    }

    const profileData = result.rows[0];

    // Calculate metabolic data if all required fields are present
    let metabolicData: { age: number | null; bmr: number | null; tdee: number | null } = { 
      age: null, 
      bmr: null, 
      tdee: null 
    };
    
    if (profileData.date_of_birth && 
        profileData.weight_kg && 
        profileData.height_cm && 
        profileData.gender && 
        profileData.activity_level) {
      
      try {
        metabolicData = calculateMetabolicData({
          date_of_birth: profileData.date_of_birth,
          weight_kg: profileData.weight_kg,
          height_cm: profileData.height_cm,
          gender: profileData.gender,
          activity_level: profileData.activity_level,
        });
        console.log(`Calculated metabolic data for user ${userId}:`, metabolicData);
      } catch (error) {
        console.error("Error calculating metabolic data:", error);
        // Continue without metabolic data if calculation fails
      }
    } else {
      console.log(`Insufficient data for metabolic calculations for user ${userId}. Missing fields:`, {
        date_of_birth: !profileData.date_of_birth,
        weight_kg: !profileData.weight_kg,
        height_cm: !profileData.height_cm,
        gender: !profileData.gender,
        activity_level: !profileData.activity_level,
      });
    }

    // Combine profile data with calculated metabolic data
    const responseData: UserProfileResponse = {
      ...profileData,
      age: metabolicData.age,
      bmr: metabolicData.bmr,
      tdee: metabolicData.tdee,
    };

    ctx.response.status = 200;
    ctx.response.body = { success: true, data: responseData };
  } catch (error) {
    console.error("Error in getUserProfileHandler:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error fetching user profile",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles PUT /api/users/me/profile
 * Creates or updates the profile for the authenticated user.
 */
export async function updateUserProfileHandler(ctx: Context) {
  try {
    const userId = ctx.state.userId as string | undefined;
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "User not authenticated" };
      return;
    }

    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Request body is missing" };
      return;
    }

    const body = ctx.request.body({ type: "json" });
    const payload = (await body.value) as UpdateUserProfileDTO;

    // Basic validation (can be expanded with a validation library)

    // Attempt to parse height_cm if it's a string
    if (payload.height_cm !== undefined && payload.height_cm !== null && typeof payload.height_cm === 'string') {
      const parsedHeight = parseFloat(payload.height_cm);
      if (!isNaN(parsedHeight)) {
        payload.height_cm = parsedHeight;
      }
    }

    // Attempt to parse weight_kg if it's a string
    if (payload.weight_kg !== undefined && payload.weight_kg !== null && typeof payload.weight_kg === 'string') {
      const parsedWeight = parseFloat(payload.weight_kg);
      if (!isNaN(parsedWeight)) {
        payload.weight_kg = parsedWeight;
      }
    }

    if (payload.date_of_birth && isNaN(new Date(payload.date_of_birth).getTime())) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: "Invalid date_of_birth format." };
        return;
    }
    if (payload.height_cm !== undefined && payload.height_cm !== null && (typeof payload.height_cm !== 'number' || payload.height_cm < 0)) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: "Invalid height_cm format." };
        return;
    }
     if (payload.weight_kg !== undefined && payload.weight_kg !== null && (typeof payload.weight_kg !== 'number' || payload.weight_kg < 0)) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: "Invalid weight_kg format." };
        return;
    }
    // Add validation for gender if you have specific allowed values
    // e.g., if (payload.gender && !['male', 'female', 'other'].includes(payload.gender)) { ... }
    // Add more validation as needed for activity_level, etc.


    // Upsert operation
    const upsertQuery = `
      INSERT INTO ${USER_PROFILES_TABLE_NAME} (
        user_id, date_of_birth, height_cm, weight_kg, gender,
        activity_level, fitness_goals, dietary_restrictions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE SET
        date_of_birth = EXCLUDED.date_of_birth,
        height_cm = EXCLUDED.height_cm,
        weight_kg = EXCLUDED.weight_kg,
        gender = EXCLUDED.gender, 
        activity_level = EXCLUDED.activity_level,
        fitness_goals = EXCLUDED.fitness_goals,
        dietary_restrictions = EXCLUDED.dietary_restrictions,
        updated_at = CURRENT_TIMESTAMP
      RETURNING user_id, date_of_birth, height_cm, weight_kg, gender, activity_level, fitness_goals, dietary_restrictions, created_at, updated_at;
    `;

    const result = await dbClient.queryObject<UserProfileSchema>(upsertQuery, [
      userId,
      payload.date_of_birth || null,
      payload.height_cm === undefined ? null : payload.height_cm,
      payload.weight_kg === undefined ? null : payload.weight_kg,
      payload.gender || null,
      payload.activity_level || null,
      payload.fitness_goals || null,
      payload.dietary_restrictions || null,
    ]);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "User profile updated successfully",
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error in updateUserProfileHandler:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Server error updating user profile",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
} 