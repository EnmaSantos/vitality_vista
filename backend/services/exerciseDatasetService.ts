import exerciseData from "../data/exercises.json" with { type: "json" };
import datasetMetadata from "../data/exercises.metadata.json" with {
  type: "json",
};

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
  imageUrl: string;
  gifUrl: string;
}

export interface Exercise extends ExerciseSummary {
  instructions: string[];
}

export interface ExerciseQuery {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  equipment?: string;
  muscle?: string;
}

export interface PaginatedExercises {
  items: ExerciseSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExerciseDatasetMetadata {
  repository: string;
  revision: string;
  license: string;
  mediaIncluded: boolean;
  mediaAvailable: boolean;
  mediaLicense: string;
  exerciseCount: number;
}

export interface ExerciseMeta {
  categories: string[];
  equipment: string[];
  muscles: string[];
  totalCount: number;
  source: ExerciseDatasetMetadata;
}

const exercises = exerciseData as Exercise[];
const source = datasetMetadata as ExerciseDatasetMetadata;
const exercisesById = new Map<string, Exercise>();

for (const exercise of exercises) {
  exercisesById.set(String(exercise.id), exercise);
  exercisesById.set(exercise.sourceId, exercise);
}

function normalize(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase("en-US") || "";
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function toSummary(exercise: Exercise): ExerciseSummary {
  const { instructions: _instructions, ...summary } = exercise;
  return summary;
}

function matchesMuscle(exercise: Exercise, muscle: string): boolean {
  return [exercise.target, exercise.muscleGroup, ...exercise.secondaryMuscles]
    .some((candidate) => normalize(candidate) === muscle);
}

export function getExerciseById(id: string | number): Exercise | undefined {
  const requestedId = String(id).trim();
  return exercisesById.get(requestedId) ||
    exercisesById.get(String(Number(requestedId)));
}

export function getAllExercises(): Exercise[] {
  return exercises;
}

export function queryExercises(query: ExerciseQuery = {}): PaginatedExercises {
  const page = Number.isInteger(query.page) && (query.page as number) > 0
    ? query.page as number
    : 1;
  const requestedLimit =
    Number.isInteger(query.limit) && (query.limit as number) > 0
      ? query.limit as number
      : 20;
  const limit = Math.min(requestedLimit, 100);
  const search = normalize(query.q);
  const category = normalize(query.category);
  const equipment = normalize(query.equipment);
  const muscle = normalize(query.muscle);

  const matches = exercises.filter((exercise) => {
    if (category && normalize(exercise.category) !== category) return false;
    if (equipment && normalize(exercise.equipment) !== equipment) return false;
    if (muscle && !matchesMuscle(exercise, muscle)) return false;
    if (!search) return true;

    return [
      exercise.name,
      exercise.category,
      exercise.bodyPart,
      exercise.equipment,
      exercise.target,
      exercise.muscleGroup,
      ...exercise.secondaryMuscles,
    ].some((value) => normalize(value).includes(search));
  });

  const total = matches.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;

  return {
    items: matches.slice(start, start + limit).map(toSummary),
    page,
    limit,
    total,
    totalPages,
  };
}

export function getExerciseMeta(): ExerciseMeta {
  return {
    categories: sortedUnique(exercises.map((exercise) => exercise.category)),
    equipment: sortedUnique(exercises.map((exercise) => exercise.equipment)),
    muscles: sortedUnique(exercises.flatMap((exercise) => [
      exercise.target,
      exercise.muscleGroup,
      ...exercise.secondaryMuscles,
    ])),
    totalCount: exercises.length,
    source,
  };
}
