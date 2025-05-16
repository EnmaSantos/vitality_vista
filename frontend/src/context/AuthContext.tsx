// frontend/src/context/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode } from 'react';
import * as authApi from '../services/authApi.ts'; // Import our new auth service with .ts extension
// 1. Define Types

// Match the sanitized user data returned from your backend's /api/auth/login or /api/auth/me
interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

// Define the shape of the context data and functions
export interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // To handle initial check for stored token
  login: (email: string, password: string) => Promise<void>; // Placeholder for now
  logout: () => void; // Placeholder for now
  register?: (email: string, password: string, firstName: string, lastName: string) => Promise<void>; // Optional: Add register later
}

// 2. Create the Context
// Provide a default stub implementation for the context values
const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as true until initial check is done
  login: async () => { throw new Error('Login function not implemented'); },
  logout: () => { throw new Error('Logout function not implemented'); },
});

// 3. Create the AuthProvider Component
interface AuthProviderProps {
  children: ReactNode; // To wrap around other components
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state for initial check

  // Check localStorage for token on initial mount
  useEffect(() => {
    console.log("AuthProvider: Checking for stored token...");
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUserString = localStorage.getItem('authUser');

      if (storedToken && storedUserString) {
        console.log("AuthProvider: Found token and user in localStorage.");
        const storedUser = JSON.parse(storedUserString) as User;
        // TODO LATER: Optionally verify token with backend /api/auth/me here
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);
      } else {
        console.log("AuthProvider: No token/user found in localStorage.");
      }
    } catch (error) {
        console.error("AuthProvider: Error reading from localStorage", error);
        // Ensure state is cleared if localStorage is corrupt
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    } finally {
        setIsLoading(false); // Finished initial check
        console.log("AuthProvider: Initial loading complete.");
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Login Function (Implemented) ---
  const login = async (email: string, password: string): Promise<void> => {
    console.log("AuthProvider: Attempting login...");
    try {
      // Call the API service function
      const responseData = await authApi.login({ email, password });

      // If API call was successful (no error thrown), process the data
      console.log("AuthProvider: Login successful.", responseData);
      setToken(responseData.token);
      setUser(responseData.user);
      setIsAuthenticated(true);

      // Store in localStorage for persistence
      localStorage.setItem('authToken', responseData.token);
      localStorage.setItem('authUser', JSON.stringify(responseData.user));

    } catch (error) {
      console.error("AuthProvider: Login failed.", error);
      // Clear any potentially stale auth state/storage on failure
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Re-throw the error so the calling component (e.g., Login page)
      // knows it failed and can display a message to the user.
      throw error;
    }
  };

  // --- Logout Function (Implemented) ---
  const logout = async (): Promise<void> => {
    console.log("AuthProvider: Logging out.");
    try {
      await authApi.logout();
      console.log("AuthProvider: API logout successful.");
    } catch (error) {
      console.error("AuthProvider: API logout failed. Proceeding with local logout.", error);
    } finally {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      console.log("AuthProvider: Local state and storage cleared.");
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  }), [token, user, isAuthenticated, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Create the useAuth Hook (for easy consumption)
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}