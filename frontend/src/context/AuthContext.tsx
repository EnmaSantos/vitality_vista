// frontend/src/context/AuthContext.tsx
// AUTH BYPASS: design-no-auth branch — always authenticated with a mock user

import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { RegisterCredentials } from '../services/authApi';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (credentials: RegisterCredentials) => Promise<void>;
}

const MOCK_USER: User = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'design@vitality-vista.dev',
  firstName: 'Design',
  lastName: 'User',
};

const MOCK_TOKEN = 'design-no-auth-mock-token';

const AuthContext = createContext<AuthContextType>({
  token: MOCK_TOKEN,
  user: MOCK_USER,
  isAuthenticated: true,
  isLoading: false,
  login: async () => {},
  logout: () => {},
  register: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    localStorage.setItem('authToken', MOCK_TOKEN);
    localStorage.setItem('authUser', JSON.stringify(MOCK_USER));
  }, []);

  const value = useMemo(() => ({
    token: MOCK_TOKEN,
    user: MOCK_USER,
    isAuthenticated: true,
    isLoading: false,
    login: async () => {},
    logout: () => {},
    register: async () => {},
  }), []);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}