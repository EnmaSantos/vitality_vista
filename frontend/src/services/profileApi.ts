// frontend/src/services/profileApi.ts

// Define the UserProfileData interface (can be shared or defined per file)
// This should match the UserProfileSchema from the backend and the one in ProfilePage.tsx
export interface UserProfileData {
  user_id?: string; // Usually not sent on update, but present in response
  date_of_birth?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  gender?: string | null;
  activity_level?: string | null;
  fitness_goals?: string | null;
  dietary_restrictions?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

// Standard API response structure (assuming your backend uses this)
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const API_BASE_URL = "https://enmanueldel-vitality-vi-71.deno.dev/api"; // Same as authApi

/**
 * Fetches the user's profile.
 * Requires authentication (token should be sent by the AuthContext/interceptor).
 * @param token - The JWT token for authentication.
 * @returns The user's profile data.
 */
export async function getUserProfile(token: string): Promise<UserProfileData> {
  console.log("profileApi: Fetching user profile...");
  try {
    const response = await fetch(`${API_BASE_URL}/users/me/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const responseData: ApiResponse<UserProfileData> = await response.json();

    if (!response.ok || !responseData.success || !responseData.data) {
      console.error("profileApi: Get profile failed response:", responseData);
      throw new Error(responseData.message || responseData.error || `Failed to fetch profile. Status: ${response.status}`);
    }
    console.log("profileApi: User profile fetched successfully.");
    return responseData.data;
  } catch (error) {
    console.error("profileApi: Get user profile API call failed:", error);
    throw error instanceof Error ? error : new Error("An unknown error occurred while fetching the profile.");
  }
}

/**
 * Updates the user's profile.
 * Requires authentication.
 * @param profileData - The profile data to update.
 * @param token - The JWT token for authentication.
 * @returns The updated user's profile data.
 */
export async function updateUserProfile(profileData: UserProfileData, token: string): Promise<UserProfileData> {
  console.log("profileApi: Updating user profile with data:", profileData);
  try {
    const response = await fetch(`${API_BASE_URL}/users/me/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const responseData: ApiResponse<UserProfileData> = await response.json();

    if (!response.ok || !responseData.success || !responseData.data) {
      console.error("profileApi: Update profile failed response:", responseData);
      throw new Error(responseData.message || responseData.error || `Failed to update profile. Status: ${response.status}`);
    }
    console.log("profileApi: User profile updated successfully.");
    return responseData.data;
  } catch (error) {
    console.error("profileApi: Update user profile API call failed:", error);
    throw error instanceof Error ? error : new Error("An unknown error occurred while updating the profile.");
  }
} 