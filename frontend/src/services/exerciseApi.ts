import { API_BASE_URL } from "../config";
import { formatExerciseName } from "../utils/formatExerciseName";

export interface ExerciseSummary {
  id: number;
  sourceId: string;
  name: string;
  category: string;
  bodyPart: string;
  equipment: string;
  target: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  imageUrl?: string;
  gifUrl?: string;
}

export interface Exercise extends ExerciseSummary {
  instructions: string[];
}

export interface ExerciseQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
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
  equipment: string[];
  muscles: string[];
  totalCount: number;
  source: {
    repository: string;
    revision: string;
    license: string;
    mediaIncluded: boolean;
    mediaAvailable?: boolean;
    mediaLicense?: string;
    mediaBaseUrl?: string;
    mediaBaseUrlEnvironmentVariable?: string;
    workerLicense?: string;
    exerciseCount: number;
  };
}

const CACHE_KEY = "vitality_exercises_cache_anatome_v1";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const EXERCISES_URL = `${API_BASE_URL}/exercises`;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("authToken");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

function buildUrl(basePath: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(basePath, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function fetchJson<T>(url: string, operationName: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`${operationName} failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`${operationName} failed. Status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function withFormattedName<T extends ExerciseSummary>(exercise: T): T {
  return {
    ...exercise,
    name: formatExerciseName(exercise.name),
  };
}

export async function getExercises(params: ExerciseQueryParams = {}): Promise<PaginatedExercisesResponse> {
  const url = buildUrl(EXERCISES_URL, {
    page: params.page,
    limit: params.limit,
    q: params.q,
    category: params.category,
    equipment: params.equipment,
    muscle: params.muscle,
  });

  const response = await fetchJson<PaginatedExercisesResponse>(url, "Fetching exercises");
  return {
    ...response,
    items: response.items.map(withFormattedName),
  };
}

export async function getExerciseMeta(): Promise<ExerciseMeta> {
  const url = buildUrl(`${EXERCISES_URL}/meta`);
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
        return (parsed.data as Exercise[]).map(withFormattedName);
      }
    } catch (e) {
      console.warn("Error parsing exercises cache, refreshing...", e);
      localStorage.removeItem(CACHE_KEY);
    }
  }

  console.log(`getAllExercises - Fetching all exercises from: ${EXERCISES_URL}/all`);
  const data = (await fetchJson<Exercise[]>(`${EXERCISES_URL}/all`, "Fetching all exercises"))
    .map(withFormattedName);

  // 2. Save to cache
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));
  } catch (e) {
    console.warn("Failed to save exercises to cache (likely quota exceeded):", e);
  }

  return data;
}

/**
 * Fetches a single exercise by its ID.
 * @param {string | number} id - The ID of the exercise to fetch.
 * @returns {Promise<Exercise>} A promise that resolves to the exercise data.
 */
export async function getExerciseById(id: string | number): Promise<Exercise> {
  const url = buildUrl(`${EXERCISES_URL}/${id}`);
  console.log(`Fetching exercise by ID: ${url}`);
  const exercise = await fetchJson<Exercise>(url, `Fetching exercise ${id}`);
  return withFormattedName(exercise);
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
