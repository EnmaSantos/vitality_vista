import {
  getAllExercises,
  getExerciseById,
  getExerciseMeta,
  queryExercises,
  resolveExerciseMediaUrl,
} from "./exerciseDatasetService.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("exercise dataset exposes the complete pinned Anatome snapshot", () => {
  const metadata = getExerciseMeta();

  assert(
    metadata.totalCount === 873,
    `Expected 873 exercises, received ${metadata.totalCount}`,
  );
  assert(
    metadata.source.exerciseCount === metadata.totalCount,
    "Expected metadata count to match the dataset",
  );
  assert(
    metadata.source.repository === "https://github.com/Rippy1911/anatome",
    "Expected Anatome to be the dataset source",
  );
  assert(
    metadata.source.mediaIncluded === false,
    "Exercise media belongs in the Cloudflare media Worker, not the backend bundle",
  );
  assert(
    metadata.source.mediaAvailable === true,
    "Expected self-hostable exercise media to be available",
  );
  assert(
    metadata.source.mediaLicense === "CC0-1.0",
    "Expected the Anatome exercise media to use CC0-1.0",
  );
  assert(
    metadata.source.license === "CC0-1.0",
    "Expected the Anatome exercise data to use CC0-1.0",
  );
  assert(
    metadata.categories.includes("strength"),
    "Expected strength category metadata",
  );
});

Deno.test("exercise lookup accepts generated IDs and Anatome ext_ids", () => {
  const numeric = getExerciseById(1);
  const source = getExerciseById("3_4_Sit-Up");

  assert(
    numeric?.name === "3/4 Sit-Up",
    "Expected exercise 1 to be the 3/4 Sit-Up",
  );
  assert(
    numeric === source,
    "Expected generated and Anatome IDs to resolve to the same record",
  );
  assert(
    (numeric?.instructions.length || 0) > 0,
    "Expected exercise instruction steps",
  );
  assert(
    numeric?.imageUrl.includes(
      "/exerciseImage?path=3_4_Sit-Up%2F0.jpg",
    ) === true,
    "Expected a static Anatome reference image URL",
  );
  assert(
    numeric?.gifUrl.includes("/exerciseGif?id=3_4_Sit-Up") === true,
    "Expected an animated Anatome exercise GIF URL",
  );
});

Deno.test("exercise media URLs can target the self-hosted Cloudflare Worker", () => {
  const resolved = resolveExerciseMediaUrl(
    "/exerciseGif?id=Air_Bike&v=4",
    "https://vitality-exercise-media.example.workers.dev/",
  );

  assert(
    resolved ===
      "https://vitality-exercise-media.example.workers.dev/exerciseGif?id=Air_Bike&v=4",
    "Expected the configured Worker origin to replace the fallback origin",
  );
});

Deno.test("exercise queries search, filter, and paginate locally", () => {
  const firstPage = queryExercises({
    q: "bench press",
    category: "strength",
    page: 1,
    limit: 5,
  });
  const secondPage = queryExercises({
    q: "bench press",
    category: "strength",
    page: 2,
    limit: 5,
  });

  assert(
    firstPage.total > 5,
    "Expected more than one page of strength bench press results",
  );
  assert(firstPage.items.length === 5, "Expected the requested page size");
  assert(secondPage.items.length > 0, "Expected a second page of results");
  assert(
    firstPage.items[0].id !== secondPage.items[0].id,
    "Expected distinct pages",
  );
  assert(
    firstPage.items.every((exercise) => exercise.category === "strength"),
    "Expected category filtering",
  );
});

Deno.test("exercise muscle filters include target and supporting muscles", () => {
  const results = queryExercises({ muscle: "abdominals", limit: 100 });

  assert(
    results.total > 0,
    "Expected exercises targeting or supporting the abdominals",
  );
  assert(
    results.items.every((exercise) =>
      [exercise.target, exercise.muscleGroup, ...exercise.secondaryMuscles]
        .some((muscle) => muscle.toLowerCase() === "abdominals")
    ),
    "Expected every result to match the requested muscle",
  );
});

Deno.test("every exercise has display data and usable media", () => {
  const exercises = getAllExercises();

  assert(
    exercises.every((exercise) =>
      exercise.name.trim() &&
      exercise.category.trim() &&
      exercise.bodyPart.trim() &&
      exercise.equipment.trim() &&
      exercise.target.trim() &&
      exercise.instructions.length > 0 &&
      exercise.imageUrl.startsWith("http") &&
      exercise.gifUrl.startsWith("http")
    ),
    "Expected all Anatome records to avoid blank or N/A exercise details",
  );
});
