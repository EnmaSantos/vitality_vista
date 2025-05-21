// frontend/src/services/authApi.ts

// Type for the sanitized user data returned by the backend
// Consider moving this to a shared types file (e.g., src/types/user.ts) if used elsewhere
interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  }
  
  // Type for the data structure inside the successful login/register response's "data" field
  interface AuthResponseData {
    token: string;
    user: User;
  }
  
  // Type for the overall API response from /login or /register
  interface AuthApiResponse {
    success: boolean;
    data?: AuthResponseData; // Present on successful login/register
    message?: string;         // Present on error
  }
  
  // Type for the login credentials payload
  interface LoginCredentials {
      email: string;
      password: string;
  }
  
  // --- Added: Type for the register credentials payload ---
  export interface RegisterCredentials extends LoginCredentials {
      firstName: string;
      lastName: string;
  }
  // --- End Added ---
  
  // Always use the direct Deno Deploy URL to avoid CORS issues
  const API_BASE_URL = "https://enmanueldel-vitality-vi-71.deno.dev/api/auth";
  
  console.log("authApi: Using API_BASE_URL:", API_BASE_URL); // Log the base URL being used
  
  /**
   * Calls the backend login endpoint.
   * @param credentials - Object containing email and password.
   * @returns The data object containing token and user if successful.
   * @throws An error with the failure message if login fails.
   */
  export async function login(credentials: LoginCredentials): Promise<AuthResponseData> {
    console.log("authApi: Sending login request..."); // Add log
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add Accept header as good practice
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
  
      // Try to parse JSON regardless of response.ok, as API might send error details
      let responseData: AuthApiResponse;
      try {
          responseData = await response.json();
      } catch (jsonError) {
          // If JSON parsing fails AND status is not ok, throw a generic error
          if (!response.ok) {
               throw new Error(`HTTP error! Status: ${response.status}`);
          }
          // If JSON parsing fails but status IS ok (unlikely but possible), rethrow json error
          console.error("JSON parsing failed despite OK status:", jsonError)
          throw new Error("Failed to parse server response.");
      }
  
  
      if (!response.ok || !responseData.success || !responseData.data) {
        // Use the message from the API response if available, otherwise a generic error
        console.log("authApi: Login failed response:", responseData); // Log the response
        throw new Error(responseData.message || `Login failed. Status: ${response.status}`);
      }
  
      // Login successful, return the data part (token + user)
      console.log("authApi: Login successful.");
      return responseData.data;
  
    } catch (error) {
      console.error("authApi: Login API call failed:", error);
      // Re-throw the error so the calling component/context can handle it
      // Ensure it's an Error object
      if (error instanceof Error) {
          throw error;
      } else {
          throw new Error("An unknown error occurred during login.");
      }
    }
  }
  
  // --- Added: Register function ---
  export async function register(credentials: RegisterCredentials): Promise<AuthResponseData> {
    console.log("authApi: Sending registration request...");
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      let responseData: AuthApiResponse;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.error("JSON parsing error during registration despite OK status:", jsonError);
        throw new Error("Failed to parse server response during registration.");
      }

      if (!response.ok || !responseData.success || !responseData.data) {
        console.log("authApi: Registration failed response:", responseData);
        throw new Error(responseData.message || `Registration failed. Status: ${response.status}`);
      }

      console.log("authApi: Registration successful.");
      return responseData.data;

    } catch (error) {
      console.error("authApi: Registration API call failed:", error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("An unknown error occurred during registration.");
      }
    }
  }
  // --- End Added ---
  
  // --- Placeholder for Verify Token function ---
  /*
  export async function verifyToken(token: string): Promise<User> {
      // Logic to call GET /api/auth/me with Authorization header
      console.log("Verify token function not implemented yet.");
      throw new Error("Verify token not implemented");
  }
  */

// --- Logout Function ---  
export async function logout(): Promise<void> {
  console.log("authApi: Sending logout request...");
  try {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        // Include credentials if your backend expects cookies to be sent
        // This might be necessary for the backend to identify the session to clear
        // However, for a simple JWT cookie clearing, the backend might not need this.
        // 'Content-Type': 'application/json', // No body being sent usually for logout
        'Accept': 'application/json',
      },
      // No body is typically sent for a logout request that just clears a cookie
    });

    const responseData = await response.json();

    if (!response.ok || !responseData.success) {
      console.log("authApi: Logout failed response:", responseData);
      throw new Error(responseData.message || `Logout failed. Status: ${response.status}`);
    }

    console.log("authApi: Logout successful.");
    // No data to return, but the promise resolves, indicating success

  } catch (error) {
    console.error("authApi: Logout API call failed:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unknown error occurred during logout.");
    }
  }
}