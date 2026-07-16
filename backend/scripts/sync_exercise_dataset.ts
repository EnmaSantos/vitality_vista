const DEFAULT_REVISION = "7455efae41b330c265e7cd4b78dfa848e7ce5ebd";
const REPOSITORY_URL = "https://github.com/hasaneyldrm/exercises-dataset";

interface SourceExercise {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  instruction_steps?: { en?: string[] };
  instructions?: { en?: string };
  muscle_group: string;
  secondary_muscles: string[];
  target: string;
  image: string;
  gif_url: string;
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

function splitInstructions(instructions: string): string[] {
  return instructions
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((step) => step.trim())
    .filter(Boolean);
}

function buildMediaUrl(
  path: string,
  expectedDirectory: "images" | "videos",
  expectedExtension: ".jpg" | ".gif",
  sourceId: string,
  revision: string,
): string {
  const normalizedPath = requireText(
    path,
    `${expectedDirectory} media path`,
    sourceId,
  )
    .replaceAll("\\", "/");
  const expectedPrefix = `${expectedDirectory}/`;

  if (
    !normalizedPath.startsWith(expectedPrefix) ||
    !normalizedPath.toLowerCase().endsWith(expectedExtension) ||
    normalizedPath.includes("..")
  ) {
    throw new Error(
      `Exercise ${sourceId} has an invalid ${expectedDirectory} media path`,
    );
  }

  return `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/${revision}/${normalizedPath}`;
}

function normalizeExercise(
  source: SourceExercise,
  revision: string,
): ExerciseDatasetRecord {
  const sourceId = requireText(source.id, "id", "unknown");
  if (!/^\d+$/.test(sourceId)) {
    throw new Error(`Exercise ${sourceId} does not have a numeric source ID`);
  }

  const numericId = Number(sourceId);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new Error(`Exercise ${sourceId} has an unsupported source ID`);
  }

  const providedSteps = source.instruction_steps?.en;
  const instructions = Array.isArray(providedSteps)
    ? providedSteps.map((step) =>
      requireText(step, "instruction step", sourceId)
    )
    : splitInstructions(
      requireText(source.instructions?.en, "English instructions", sourceId),
    );

  if (instructions.length === 0) {
    throw new Error(`Exercise ${sourceId} has no English instruction steps`);
  }

  return {
    id: numericId,
    sourceId,
    name: requireText(source.name, "name", sourceId),
    category: requireText(source.category, "category", sourceId),
    bodyPart: requireText(source.body_part, "body part", sourceId),
    equipment: requireText(source.equipment, "equipment", sourceId),
    target: requireText(source.target, "target", sourceId),
    muscleGroup: requireText(source.muscle_group, "muscle group", sourceId),
    secondaryMuscles: Array.isArray(source.secondary_muscles)
      ? source.secondary_muscles.map((muscle) =>
        requireText(muscle, "secondary muscle", sourceId)
      )
      : [],
    instructions,
    imageUrl: buildMediaUrl(source.image, "images", ".jpg", sourceId, revision),
    gifUrl: buildMediaUrl(source.gif_url, "videos", ".gif", sourceId, revision),
  };
}

const revision = Deno.args[0]?.trim() || DEFAULT_REVISION;
if (!/^[a-f0-9]{40}$/i.test(revision)) {
  throw new Error(
    "Pass a full 40-character Git commit SHA as the optional revision argument",
  );
}

const sourceUrl =
  `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/${revision}/data/exercises.json`;
const response = await fetch(sourceUrl);
if (!response.ok) {
  throw new Error(
    `Failed to download exercises dataset: ${response.status} ${response.statusText}`,
  );
}

const sourceData = await response.json();
if (!Array.isArray(sourceData)) {
  throw new Error("The upstream exercises dataset is not a JSON array");
}

const exercises = (sourceData as SourceExercise[])
  .map((exercise) => normalizeExercise(exercise, revision))
  .sort((left, right) => left.id - right.id);

const ids = new Set<number>();
for (const exercise of exercises) {
  if (ids.has(exercise.id)) {
    throw new Error(`Duplicate exercise ID ${exercise.id}`);
  }
  ids.add(exercise.id);
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
        license: "Educational and non-commercial use only",
        mediaIncluded: false,
        mediaAvailable: true,
        mediaLicense: "Educational and non-commercial use only",
        exerciseCount: exercises.length,
      },
      null,
      2,
    )
  }\n`,
);

console.log(`Wrote ${exercises.length} exercises from ${revision}`);
console.log(
  "Media files were not bundled; records contain pinned upstream URLs for educational and non-commercial use.",
);
