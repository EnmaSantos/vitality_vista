const DEFAULT_EXERCISE_API_BASE_URL = "https://excersice-api.fly.dev";
const configuredExerciseApiBaseUrl = import.meta.env.VITE_EXERCISE_API_URL || DEFAULT_EXERCISE_API_BASE_URL;
const API_BASE_URL = configuredExerciseApiBaseUrl.endsWith("/")
  ? configuredExerciseApiBaseUrl
  : `${configuredExerciseApiBaseUrl}/`;

export interface Exercise {
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
  id: number;
  calories_per_hour: number | null;
  duration_minutes: number | null;
  total_calories: number | null;
}

export type ExerciseSummary = Omit<Exercise, "instructions">;

export interface ExerciseQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  level?: string;
  equipment?: string;
  muscle?: string;
}

export interface PaginatedExercisesResponse {
  items: ExerciseSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExerciseMeta {
  categories: string[];
  levels: string[];
  equipment: string[];
  muscles: string[];
  totalCount: number;
}

const CACHE_KEY = "vitality_exercises_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(path, API_BASE_URL);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function fetchJson<T>(url: string, operationName: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`${operationName} failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`${operationName} failed. Status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getExercises(params: ExerciseQueryParams = {}): Promise<PaginatedExercisesResponse> {
  const url = buildUrl("v2/exercises", {
    page: params.page,
    limit: params.limit,
    q: params.q,
    category: params.category,
    level: params.level,
    equipment: params.equipment,
    muscle: params.muscle,
  });

  return fetchJson<PaginatedExercisesResponse>(url, "Fetching exercises");
}

export async function getExerciseMeta(): Promise<ExerciseMeta> {
  const url = buildUrl("v2/exercises/meta");
  return fetchJson<ExerciseMeta>(url, "Fetching exercise metadata");
}

/**
 * Fetches all exercises from the API.
 * Uses cached data if available and fresh.
 * @returns {Promise<Exercise[]>} A promise that resolves to an array of all exercises.
 */
export async function getAllExercises(): Promise<Exercise[]> {
  // 1. Try to get from cache
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      // Check if cache is still valid
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log("Using cached exercises data");
        return parsed.data as Exercise[];
      }
    } catch (e) {
      console.warn("Error parsing exercises cache, refreshing...", e);
      localStorage.removeItem(CACHE_KEY);
    }
  }

  const url = `${API_BASE_URL}exercises`;
  console.log(`getAllExercises - Fetching all exercises from: ${url}`);
  const data = await fetchJson<Exercise[]>(url, "Fetching all exercises");

  // 2. Save to cache
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));
  } catch (e) {
    console.warn("Failed to save exercises to cache (likely quota exceeded):", e);
  }

  return data as Exercise[];
}

/**
 * Fetches a single exercise by its ID.
 * @param {string | number} id - The ID of the exercise to fetch.
 * @returns {Promise<Exercise>} A promise that resolves to the exercise data.
 */
export async function getExerciseById(id: string | number): Promise<Exercise> {
  const url = buildUrl(`v2/exercises/${id}`);
  console.log(`Fetching exercise by ID: ${url}`);
  return fetchJson<Exercise>(url, `Fetching exercise ${id}`);
}

/**
 * Searches for exercises by name.
 * @param {string} name - The search term.
 * @returns {Promise<ExerciseSummary[]>} A promise that resolves to matching exercise summaries.
 */
export async function searchExercisesByName(name: string): Promise<ExerciseSummary[]> {
  const data = await getExercises({ q: name, page: 1, limit: 100 });
  return data.items;
}
