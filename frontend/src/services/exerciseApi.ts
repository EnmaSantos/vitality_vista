// frontend/src/services/exerciseApi.ts

// Import the base URL from the environment variable we set up in Step 1
const API_BASE_URL = import.meta.env.VITE_EXERCISE_API_URL;

// Define a TypeScript interface matching the Exercise data structure
// (Based on the Exercise API README provided earlier)
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

/**
 * Fetches all exercises from the API.
 * @returns {Promise<Exercise[]>} A promise that resolves to an array of all exercises.
 */
export async function getAllExercises(): Promise<Exercise[]> {
  const url = `${API_BASE_URL}exercises`;
  console.log(`🔍 getAllExercises - Fetching all exercises from: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Failed to fetch exercises: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Failed to fetch exercises. Status: ${response.status}`);
  }

  const data = await response.json();
  return data as Exercise[];
}

/**
 * Fetches a single exercise by its ID.
 * @param {string | number} id - The ID of the exercise to fetch.
 * @returns {Promise<Exercise>} A promise that resolves to the exercise data.
 */
export async function getExerciseById(id: string | number): Promise<Exercise> {
  const url = `${API_BASE_URL}exercises/${id}`;
  console.log(`Fetching exercise by ID: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Failed to fetch exercise ${id}: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Failed to fetch exercise ${id}. Status: ${response.status}`);
  }

  const data = await response.json();
  return data as Exercise;
}

/**
 * Searches for exercises by name.
 * @param {string} name - The search term.
 * @returns {Promise<Exercise[]>} A promise that resolves to an array of matching exercises.
 */
export async function searchExercisesByName(name: string): Promise<Exercise[]> {
  const encodedName = encodeURIComponent(name);
  const url = `${API_BASE_URL}exercises/search/${encodedName}`;
  console.log(`🔍 searchExercisesByName - Searching exercises by name: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Failed to search exercises for "${name}": ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Failed to search exercises for "${name}". Status: ${response.status}`);
  }

  const data = await response.json();
  return data as Exercise[];
}