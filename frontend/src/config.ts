// frontend/src/config.ts

const getApiBaseUrl = () => {
  // Check for various environment variable names used in the project
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // If in development mode, default to localhost.
  if (import.meta.env.DEV) {
    return "http://localhost:8000/api";
  }

  // In production (or other modes), default to the deployed backend URL.
  return "https://enmanueldel-vitality-vi-71.deno.dev/api";
};

export const API_BASE_URL = getApiBaseUrl();
