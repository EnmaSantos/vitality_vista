import { API_BASE_URL } from '../config';
import { formatExerciseName } from '../utils/formatExerciseName';
import type { Exercise, ExerciseSummary } from './exerciseApi';

export type RoutineDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type RoutineFormat = 'straight_sets' | 'circuit' | 'interval' | 'mobility_flow';
export type RoutinePhase = 'warmup' | 'work' | 'cooldown';

export interface ExerciseRecommendation {
  difficulty: RoutineDifficulty;
  impactLevel: 'low' | 'moderate' | 'high';
  movementPatterns: string[];
  sportTags: string[];
  wellnessRegions: string[];
  routineEligibility: boolean;
}

export interface CatalogExerciseSummary extends ExerciseSummary {
  recommendation?: ExerciseRecommendation;
}

export interface CatalogExercise extends Exercise {
  recommendation?: ExerciseRecommendation;
}

export interface RoutineExercise {
  sourceId: string;
  phase: RoutinePhase;
  order: number;
  sets: number | null;
  reps: string | null;
  durationSeconds: number | null;
  restSeconds: number;
  sideGuidance: string;
  notes: string;
  exercise?: CatalogExerciseSummary;
}

export interface Routine {
  slug: string;
  name: string;
  summary: string;
  difficulty: RoutineDifficulty;
  estimatedDurationMinutes: number;
  goals: string[];
  bodyRegions: string[];
  sports: string[];
  equipment: string[];
  format: RoutineFormat;
  rounds: number;
  wellness: boolean;
  catalogVersion: string;
  attribution: string;
  license: string;
  exercises: RoutineExercise[];
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  catalogVersion: string;
}

export interface BodyRegion {
  id: string;
  label: string;
  view: 'front' | 'back';
  description: string;
  exerciseCount: number;
  routineCount: number;
}

export interface Sport {
  id: string;
  label: string;
  routineCount: number;
  exerciseCount: number;
  notice: string;
}

export interface RoutineQuery {
  page?: number;
  limit?: number;
  search?: string;
  goal?: string;
  equipment?: string;
  difficulty?: string;
  format?: string;
  bodyRegion?: string;
  sport?: string;
  maxDuration?: number;
  wellness?: boolean;
}

export interface CatalogExerciseQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  equipment?: string;
  muscle?: string;
  bodyRegion?: string;
  sport?: string;
  difficulty?: string;
  impact?: string;
}

const CATALOG_BASE_URL = `${API_BASE_URL}/v1`;

function buildUrl<T extends object>(path: string, params: T = {} as T): string {
  const url = new URL(`${CATALOG_BASE_URL}${path}`, window.location.origin);
  Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function fetchCatalogJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(response.status === 404 ? 'Catalog item not found.' : `Catalog request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

function formatCatalogExercise<T extends ExerciseSummary>(exercise: T): T {
  return { ...exercise, name: formatExerciseName(exercise.name) };
}

export async function getCatalogExercises(query: CatalogExerciseQuery = {}): Promise<PaginatedResponse<CatalogExerciseSummary>> {
  const result = await fetchCatalogJson<PaginatedResponse<CatalogExerciseSummary>>(buildUrl('/exercises', query));
  return { ...result, items: result.items.map(formatCatalogExercise) };
}

export async function getCatalogExercise(id: string | number): Promise<CatalogExercise> {
  return formatCatalogExercise(await fetchCatalogJson<CatalogExercise>(buildUrl(`/exercises/${id}`)));
}

export async function getRoutines(query: RoutineQuery = {}): Promise<PaginatedResponse<Routine>> {
  return fetchCatalogJson<PaginatedResponse<Routine>>(buildUrl('/routines', query));
}

export async function getRoutine(slug: string): Promise<Routine> {
  const routine = await fetchCatalogJson<Routine>(buildUrl(`/routines/${encodeURIComponent(slug)}`));
  return { ...routine, exercises: routine.exercises.map((item) => ({ ...item, exercise: item.exercise ? formatCatalogExercise(item.exercise) : undefined })) };
}

export async function getBodyRegions(): Promise<BodyRegion[]> {
  const response = await fetchCatalogJson<{ items: BodyRegion[] }>(buildUrl('/body-regions'));
  return response.items;
}

export async function getSports(): Promise<Sport[]> {
  const response = await fetchCatalogJson<{ items: Sport[] }>(buildUrl('/sports'));
  return response.items;
}

export async function getOpenApiContract(): Promise<Record<string, unknown>> {
  return fetchCatalogJson<Record<string, unknown>>(buildUrl('/openapi.json'));
}
