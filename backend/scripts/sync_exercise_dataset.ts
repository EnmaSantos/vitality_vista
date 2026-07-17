const DEFAULT_REVISION = "f117b127dc82fa0c9a8e7e21c7df41ad43154dac";
const REPOSITORY_URL = "https://github.com/Rippy1911/anatome";
const DEFAULT_MEDIA_BASE_URL =
  "https://vitality-exercise-media.enmasantos.workers.dev";
const GIF_PLAYBACK_VERSION = "4";

interface SourceExercise {
  ext_id: string;
  name: string;
  category?: string;
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  images?: string[];
}

interface ExerciseDatasetRecord {
  id: number;
  sourceId: string;
  name: string;
  category: string;
  bodyPart: string;
  equipment: string;
  target: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  instructions: string[];
  imageUrl: string;
  gifUrl: string;
}

function requireText(value: unknown, field: string, sourceId: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Exercise ${sourceId} has an invalid ${field}`);
  }
  return value.trim();
}

function optionalText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizedTextArray(
  value: unknown,
  _field: string,
  _sourceId: string,
): string[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) =>
    typeof item === "string" && item.trim() ? [item.trim()] : []
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function requireImagePath(source: SourceExercise, sourceId: string): string {
  const imagePath = requireText(source.images?.[0], "reference image", sourceId)
    .replaceAll("\\", "/");

  if (
    imagePath.startsWith("/") ||
    imagePath.includes("..") ||
    imagePath.includes("//") ||
    !imagePath.toLowerCase().endsWith(".jpg") ||
    !/^[A-Za-z0-9\-_. /]+$/.test(imagePath)
  ) {
    throw new Error(`Exercise ${sourceId} has an invalid reference image path`);
  }

  return imagePath;
}

function normalizeExercise(
  source: SourceExercise,
  id: number,
): ExerciseDatasetRecord {
  const sourceId = requireText(source.ext_id, "ext_id", "unknown");
  if (!/^[A-Za-z0-9_-]+$/.test(sourceId)) {
    throw new Error(`Exercise ${sourceId} has an unsupported ext_id`);
  }

  const primaryMuscles = normalizedTextArray(
    source.primaryMuscles,
    "primary muscle",
    sourceId,
  );
  if (primaryMuscles.length === 0) {
    throw new Error(`Exercise ${sourceId} has no primary muscle`);
  }

  const secondaryMuscles = normalizedTextArray(
    source.secondaryMuscles,
    "secondary muscle",
    sourceId,
  );
  const instructions = normalizedTextArray(
    source.instructions,
    "instruction",
    sourceId,
  );
  const target = primaryMuscles[0];
  const imagePath = requireImagePath(source, sourceId);

  return {
    id,
    sourceId,
    name: requireText(source.name, "name", sourceId),
    category: optionalText(source.category, "strength"),
    bodyPart: target,
    equipment: optionalText(source.equipment, "body only"),
    target,
    muscleGroup: target,
    secondaryMuscles: unique([
      ...primaryMuscles.slice(1),
      ...secondaryMuscles,
    ]),
    instructions: instructions.length > 0
      ? instructions
      : [
        "Use the movement demonstration as a visual guide and perform the exercise with controlled form.",
      ],
    imageUrl: `/exerciseImage?path=${encodeURIComponent(imagePath)}`,
    gifUrl:
      `/exerciseGif?id=${encodeURIComponent(sourceId)}&v=${GIF_PLAYBACK_VERSION}`,
  };
}

const revision = Deno.args[0]?.trim() || DEFAULT_REVISION;
if (!/^[a-f0-9]{40}$/i.test(revision)) {
  throw new Error(
    "Pass a full 40-character Git commit SHA as the optional revision argument",
  );
}

const sourceUrl =
  `https://raw.githubusercontent.com/Rippy1911/anatome/${revision}/api/data/exercises.json`;
const response = await fetch(sourceUrl);
if (!response.ok) {
  throw new Error(
    `Failed to download Anatome exercises: ${response.status} ${response.statusText}`,
  );
}

const sourceData = await response.json();
if (!Array.isArray(sourceData)) {
  throw new Error("The upstream Anatome dataset is not a JSON array");
}

const sortedSource = (sourceData as SourceExercise[]).toSorted((left, right) =>
  left.name.localeCompare(right.name, "en-US") ||
  left.ext_id.localeCompare(right.ext_id, "en-US")
);
const exercises = sortedSource.map((exercise, index) =>
  normalizeExercise(exercise, index + 1)
);

const sourceIds = new Set<string>();
for (const exercise of exercises) {
  if (sourceIds.has(exercise.sourceId)) {
    throw new Error(`Duplicate Anatome ext_id ${exercise.sourceId}`);
  }
  sourceIds.add(exercise.sourceId);
}

const dataDirectory = new URL("../data/", import.meta.url);
await Deno.mkdir(dataDirectory, { recursive: true });
await Deno.writeTextFile(
  new URL("exercises.json", dataDirectory),
  `${JSON.stringify(exercises)}\n`,
);
await Deno.writeTextFile(
  new URL("exercises.metadata.json", dataDirectory),
  `${
    JSON.stringify(
      {
        repository: REPOSITORY_URL,
        revision,
        license: "CC0-1.0",
        mediaIncluded: false,
        mediaAvailable: true,
        mediaLicense: "CC0-1.0",
        mediaBaseUrl: DEFAULT_MEDIA_BASE_URL,
        mediaBaseUrlEnvironmentVariable: "EXERCISE_MEDIA_BASE_URL",
        workerLicense: "Apache-2.0",
        exerciseCount: exercises.length,
      },
      null,
      2,
    )
  }\n`,
);

console.log(`Wrote ${exercises.length} Anatome exercises from ${revision}`);
console.log(
  "Media URLs are resolved through EXERCISE_MEDIA_BASE_URL, with the Vitality Cloudflare Worker as the fallback.",
);
