// frontend/src/context/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode } from 'react';
import * as authApi from '../services/authApi';
import { RegisterCredentials } from '../services/authApi';

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
  register: (credentials: RegisterCredentials) => Promise<void>; // Added register
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
  register: async () => { throw new Error('Register function not implemented'); }, // Added default
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
      
      if (storedToken) {
        console.log("AuthProvider: Found token in localStorage. Verifying...");
        authApi.verifyToken()
          .then(data => {
            console.log("AuthProvider: Token is valid.", data);
            setToken(data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem('authToken', data.token); // Refresh the token
            localStorage.setItem('authUser', JSON.stringify(data.user));
          })
          .catch(error => {
            console.error("AuthProvider: Token verification failed.", error);
            // Clear invalid token from storage and state
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          })
          .finally(() => {
            setIsLoading(false);
            console.log("AuthProvider: Initial loading complete.");
          });
      } else {
        console.log("AuthProvider: No token found in localStorage.");
        setIsLoading(false); // No token, so not loading
      }
    } catch (error) {
        console.error("AuthProvider: Error during initial auth check", error);
        // Ensure state is cleared if something goes wrong
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setIsLoading(false); // Finished check, even if with an error
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
      await authApi.logout(); // It's okay if this fails, we still log out locally.
      console.log("AuthProvider: API logout successful.");
    } catch (error) {
      console.error("AuthProvider: API logout call failed, but proceeding with local logout.", error);
    } finally {
      // Clear state and localStorage regardless of API call outcome
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      console.log("AuthProvider: Local state and storage cleared.");
    }
  };

  // --- Added: Register Function ---
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    console.log("AuthProvider: Attempting registration...");
    try {
      const responseData = await authApi.register(credentials);
      console.log("AuthProvider: Registration successful, user auto-logged in.", responseData);
      // Backend returns token and user upon successful registration
      setToken(responseData.token);
      setUser(responseData.user);
      setIsAuthenticated(true);
      localStorage.setItem('authToken', responseData.token);
      localStorage.setItem('authUser', JSON.stringify(responseData.user));
    } catch (error) {
      console.error("AuthProvider: Registration failed.", error);
      // Clear any potentially stale auth state/storage on failure
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      throw error; // Re-throw to be handled by the Signup component
    }
  };
  // --- End Added ---

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register
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