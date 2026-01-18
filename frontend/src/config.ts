// Centralized configuration for the application

// Base URL for the backend API
// Defaults to localhost in development, and the known production URL in production
// Can be overridden by VITE_API_BASE_URL environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "https://enmanueldel-vitality-vi-71.deno.dev/api");
