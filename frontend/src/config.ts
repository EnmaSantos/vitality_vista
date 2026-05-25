// Centralized configuration for the application

// Base URL for the backend API
// Defaults to localhost in development, and the known production URL in production
// Can be overridden by VITE_API_BASE_URL environment variable
const LEGACY_DENO_API_BASE_URL = "https://enmanueldel-vitality-vi-71.deno.dev/api";
const PRODUCTION_API_BASE_URL = "https://vitality-vista.enmasantos.deno.net/api";
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL =
  configuredApiBaseUrl && configuredApiBaseUrl !== LEGACY_DENO_API_BASE_URL
    ? configuredApiBaseUrl
    : import.meta.env.DEV
      ? "http://localhost:8000/api"
      : PRODUCTION_API_BASE_URL;
