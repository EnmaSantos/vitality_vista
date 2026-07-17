import bodyRegionData from "../data/body-regions.json" with { type: "json" };
import recommendationData from "../data/exercise-recommendations.json" with { type: "json" };
import routineData from "../data/routines.json" with { type: "json" };
import catalogMetadata from "../data/routines.metadata.json" with { type: "json" };
import {
  Exercise,
  ExerciseSummary,
  getAllExercises,
  getExerciseById,
  getExerciseMeta,
} from "./exerciseDatasetService.ts";

export type RoutineDifficulty = "beginner" | "intermediate" | "advanced";
export type ImpactLevel = "low" | "moderate" | "high";
export type RoutineFormat = "straight_sets" | "circuit" | "interval" | "mobility_flow";
export type RoutinePhase = "warmup" | "work" | "cooldown";

export interface ExerciseRecommendation {
  difficulty: RoutineDifficulty;
  impactLevel: ImpactLevel;
  movementPatterns: string[];
  sportTags: string[];
  wellnessRegions: string[];
  routineEligibility: boolean;
}

export interface RecommendedExerciseSummary extends ExerciseSummary {
  recommendation?: ExerciseRecommendation;
}

export interface RecommendedExercise extends Exercise {
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

export interface ResolvedRoutine extends Routine {
  exercises: Array<RoutineExercise & { exercise: RecommendedExerciseSummary }>;
}

interface BodyRegion {
  id: string;
  label: string;
  view: "front" | "back";
  description: string;
}

interface CatalogMetadata {
  catalogVersion: string;
  publishedAt: string;
  routineCount: number;
  attribution: string;
  license: string;
  licenseUrl: string;
  provenance: string;
  exerciseSource: { name: string; repository: string; license: string };
  wellnessNotice: string;
  sportsNotice: string;
}

interface PublicExerciseQuery {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  equipment?: string;
  muscle?: string;
  bodyRegion?: string;
  sport?: string;
  difficulty?: string;
  impact?: string;
}

interface RoutineQuery {
  page?: number;
  limit?: number;
  q?: string;
  goal?: string;
  equipment?: string;
  difficulty?: string;
  format?: string;
  bodyRegion?: string;
  sport?: string;
  maximumDuration?: number;
  wellness?: boolean;
}

const routines = routineData as Routine[];
const bodyRegions = bodyRegionData as BodyRegion[];
const metadata = catalogMetadata as CatalogMetadata;
const recommendations = new Map(
  (recommendationData as Array<{ sourceId: string; recommendation: ExerciseRecommendation }>).map((entry) => [entry.sourceId, entry.recommendation]),
);
const routinesBySlug = new Map(routines.map((routine) => [routine.slug, routine]));

function normalize(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase("en-US") ?? "";
}

function includesNormalized(values: string[], requested: string): boolean {
  return values.some((value) => normalize(value) === requested);
}

function toRecommendedSummary(exercise: Exercise): RecommendedExerciseSummary {
  const { instructions: _instructions, ...summary } = exercise;
  return { ...summary, recommendation: recommendations.get(exercise.sourceId) };
}

function toRecommendedExercise(exercise: Exercise): RecommendedExercise {
  return { ...exercise, recommendation: recommendations.get(exercise.sourceId) };
}

function exerciseMatchesRegion(exercise: Exercise, bodyRegion: string): boolean {
  return normalize(exercise.bodyPart) === bodyRegion ||
    normalize(exercise.target) === bodyRegion ||
    normalize(exercise.muscleGroup) === bodyRegion ||
    exercise.secondaryMuscles.some((muscle) => normalize(muscle) === bodyRegion);
}

function rankForRegion(exercise: Exercise, bodyRegion: string): number {
  if (!bodyRegion) return 0;
  if ([exercise.bodyPart, exercise.target, exercise.muscleGroup].some((region) => normalize(region) === bodyRegion)) return 0;
  return exercise.secondaryMuscles.some((region) => normalize(region) === bodyRegion) ? 1 : 2;
}

export function resolveRoutine(routine: Routine): ResolvedRoutine {
  return {
    ...routine,
    exercises: routine.exercises.map((item) => {
      const exercise = getExerciseById(item.sourceId);
      if (!exercise) throw new Error(`Routine ${routine.slug} references missing exercise ${item.sourceId}`);
      return { ...item, exercise: toRecommendedSummary(exercise) };
    }),
  };
}

export function getRoutineBySlug(slug: string): ResolvedRoutine | undefined {
  const routine = routinesBySlug.get(normalize(slug));
  return routine ? resolveRoutine(routine) : undefined;
}

export function getCatalogMetadata() {
  return {
    ...metadata,
    exerciseCatalog: getExerciseMeta(),
    endpoints: { version: "v1", basePath: "/api/v1" },
  };
}

export function queryPublicExercises(query: PublicExerciseQuery = {}) {
  const page = Number.isInteger(query.page) && (query.page as number) > 0 ? query.page as number : 1;
  const requestedLimit = Number.isInteger(query.limit) && (query.limit as number) > 0 ? query.limit as number : 20;
  const limit = Math.min(requestedLimit, 100);
  const q = normalize(query.q);
  const category = normalize(query.category);
  const equipment = normalize(query.equipment);
  const muscle = normalize(query.muscle);
  const bodyRegion = normalize(query.bodyRegion);
  const sport = normalize(query.sport);
  const difficulty = normalize(query.difficulty);
  const impact = normalize(query.impact);

  const matching = getAllExercises().filter((exercise) => {
    const recommendation = recommendations.get(exercise.sourceId);
    if (category && normalize(exercise.category) !== category) return false;
    if (equipment && normalize(exercise.equipment) !== equipment) return false;
    if (muscle && !exerciseMatchesRegion(exercise, muscle)) return false;
    if (bodyRegion && !exerciseMatchesRegion(exercise, bodyRegion)) return false;
    if (sport && !recommendation?.sportTags.some((tag) => normalize(tag) === sport)) return false;
    if (difficulty && normalize(recommendation?.difficulty) !== difficulty) return false;
    if (impact && normalize(recommendation?.impactLevel) !== impact) return false;
    if (!q) return true;
    return [exercise.name, exercise.category, exercise.bodyPart, exercise.equipment, exercise.target, exercise.muscleGroup, ...exercise.secondaryMuscles]
      .some((value) => normalize(value).includes(q));
  }).sort((left, right) => rankForRegion(left, bodyRegion) - rankForRegion(right, bodyRegion) || left.name.localeCompare(right.name));

  const total = matching.length;
  const start = (page - 1) * limit;
  return { items: matching.slice(start, start + limit).map(toRecommendedSummary), page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit), catalogVersion: metadata.catalogVersion };
}

export function getPublicExercise(id: string): RecommendedExercise | undefined {
  const exercise = getExerciseById(id);
  return exercise ? toRecommendedExercise(exercise) : undefined;
}

export function queryRoutines(query: RoutineQuery = {}) {
  const page = Number.isInteger(query.page) && (query.page as number) > 0 ? query.page as number : 1;
  const requestedLimit = Number.isInteger(query.limit) && (query.limit as number) > 0 ? query.limit as number : 20;
  const limit = Math.min(requestedLimit, 50);
  const q = normalize(query.q);
  const goal = normalize(query.goal);
  const equipment = normalize(query.equipment);
  const difficulty = normalize(query.difficulty);
  const format = normalize(query.format);
  const bodyRegion = normalize(query.bodyRegion);
  const sport = normalize(query.sport);
  const matching = routines.filter((routine) => {
    if (goal && !includesNormalized(routine.goals, goal)) return false;
    if (equipment && !includesNormalized(routine.equipment, equipment)) return false;
    if (difficulty && normalize(routine.difficulty) !== difficulty) return false;
    if (format && normalize(routine.format) !== format) return false;
    if (bodyRegion && !includesNormalized(routine.bodyRegions, bodyRegion)) return false;
    if (sport && !includesNormalized(routine.sports, sport)) return false;
    if (query.maximumDuration && routine.estimatedDurationMinutes > query.maximumDuration) return false;
    if (query.wellness !== undefined && routine.wellness !== query.wellness) return false;
    if (!q) return true;
    return [routine.name, routine.summary, ...routine.goals, ...routine.bodyRegions, ...routine.sports, ...routine.equipment]
      .some((value) => normalize(value).includes(q));
  });
  const total = matching.length;
  const start = (page - 1) * limit;
  return { items: matching.slice(start, start + limit), page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit), catalogVersion: metadata.catalogVersion };
}

export function getBodyRegions() {
  return bodyRegions.map((region) => ({
    ...region,
    exerciseCount: getAllExercises().filter((exercise) => exerciseMatchesRegion(exercise, normalize(region.id))).length,
    routineCount: routines.filter((routine) => includesNormalized(routine.bodyRegions, normalize(region.id))).length,
  }));
}

export function getSports() {
  const sports = [...new Set(routines.flatMap((routine) => routine.sports))].sort();
  return sports.map((sport) => ({
    id: sport,
    label: sport.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    routineCount: routines.filter((routine) => includesNormalized(routine.sports, normalize(sport))).length,
    exerciseCount: [...recommendations.values()].filter((recommendation) => includesNormalized(recommendation.sportTags, normalize(sport))).length,
    notice: metadata.sportsNotice,
  }));
}

export function validateRoutineCatalog(): string[] {
  const errors: string[] = [];
  const allowedDifficulty = new Set(["beginner", "intermediate", "advanced"]);
  const allowedFormat = new Set(["straight_sets", "circuit", "interval", "mobility_flow"]);
  const allowedPhase = new Set(["warmup", "work", "cooldown"]);
  if (routines.length !== 50) errors.push(`Expected 50 routines, found ${routines.length}`);
  if (new Set(routines.map((routine) => routine.slug)).size !== routines.length) errors.push("Routine slugs must be unique");
  const distribution = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const routine of routines) {
    if (!allowedDifficulty.has(routine.difficulty)) errors.push(`${routine.slug}: invalid difficulty`);
    else distribution[routine.difficulty] += 1;
    if (!allowedFormat.has(routine.format)) errors.push(`${routine.slug}: invalid format`);
    if (routine.rounds < 1) errors.push(`${routine.slug}: rounds must be positive`);
    if (routine.estimatedDurationMinutes < 10 || routine.estimatedDurationMinutes > 45) errors.push(`${routine.slug}: duration must be 10-45 minutes`);
    if (routine.wellness && routine.difficulty === "advanced") errors.push(`${routine.slug}: wellness routine cannot be advanced`);
    if (!routine.attribution || !routine.license || !routine.catalogVersion) errors.push(`${routine.slug}: incomplete license metadata`);
    if (routine.exercises.length < 4 || routine.exercises.length > 10) errors.push(`${routine.slug}: must have 4-10 movements`);
    const phaseRanks: Record<string, number> = { warmup: 0, work: 1, cooldown: 2 };
    let lastPhase = -1;
    for (const [index, item] of routine.exercises.entries()) {
      if (!getExerciseById(item.sourceId)) errors.push(`${routine.slug}: missing ${item.sourceId}`);
      if (!allowedPhase.has(item.phase)) errors.push(`${routine.slug}: invalid phase ${item.phase}`);
      if (item.order !== index + 1) errors.push(`${routine.slug}: exercise order is not contiguous`);
      if (phaseRanks[item.phase] < lastPhase) errors.push(`${routine.slug}: phase ordering is invalid`);
      lastPhase = phaseRanks[item.phase];
      if (item.durationSeconds !== null && item.durationSeconds < 0) errors.push(`${routine.slug}: negative duration`);
    }
  }
  if (distribution.beginner !== 20 || distribution.intermediate !== 20 || distribution.advanced !== 10) {
    errors.push(`Difficulty distribution is ${JSON.stringify(distribution)}, expected 20/20/10`);
  }
  for (const region of bodyRegions) {
    if (!routines.some((routine) => routine.bodyRegions.includes(region.id))) errors.push(`No routine covers ${region.id}`);
    if (!getAllExercises().some((exercise) => exerciseMatchesRegion(exercise, normalize(region.id)))) errors.push(`No exercise covers ${region.id}`);
  }
  for (const sport of getSports()) {
    if (sport.routineCount < 1) errors.push(`No routine covers ${sport.id}`);
    if (sport.exerciseCount < 5) errors.push(`Sport ${sport.id} has fewer than five curated exercises`);
  }
  if (!metadata.attribution || !metadata.license || !metadata.licenseUrl || !metadata.provenance) errors.push("Catalog metadata is incomplete");
  return errors;
}

const validationErrors = validateRoutineCatalog();
if (validationErrors.length > 0) throw new Error(`Invalid routine catalog:\n${validationErrors.join("\n")}`);
