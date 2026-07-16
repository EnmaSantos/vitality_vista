import {
  getExerciseById,
  getExerciseMeta,
  queryExercises,
} from "./exerciseDatasetService.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("exercise dataset exposes the complete pinned snapshot", () => {
  const metadata = getExerciseMeta();

  assert(
    metadata.totalCount === 1324,
    `Expected 1324 exercises, received ${metadata.totalCount}`,
  );
  assert(
    metadata.source.exerciseCount === metadata.totalCount,
    "Expected metadata count to match the dataset",
  );
  assert(
    metadata.source.mediaIncluded === false,
    "Restricted upstream media must not be included",
  );
  assert(
    metadata.categories.includes("chest"),
    "Expected chest category metadata",
  );
});

Deno.test("exercise lookup accepts numeric and zero-padded source IDs", () => {
  const numeric = getExerciseById(1);
  const source = getExerciseById("0001");

  assert(
    numeric?.name === "3/4 sit-up",
    "Expected exercise 1 to be the 3/4 sit-up",
  );
  assert(
    numeric === source,
    "Expected numeric and source IDs to resolve to the same record",
  );
  assert(
    (numeric?.instructions.length || 0) > 0,
    "Expected English instruction steps",
  );
});

Deno.test("exercise queries search, filter, and paginate locally", () => {
  const firstPage = queryExercises({
    q: "bench press",
    category: "chest",
    page: 1,
    limit: 5,
  });
  const secondPage = queryExercises({
    q: "bench press",
    category: "chest",
    page: 2,
    limit: 5,
  });

  assert(
    firstPage.total > 5,
    "Expected more than one page of chest bench press results",
  );
  assert(firstPage.items.length === 5, "Expected the requested page size");
  assert(secondPage.items.length > 0, "Expected a second page of results");
  assert(
    firstPage.items[0].id !== secondPage.items[0].id,
    "Expected distinct pages",
  );
  assert(
    firstPage.items.every((exercise) => exercise.category === "chest"),
    "Expected category filtering",
  );
});

Deno.test("exercise muscle filters include target and supporting muscles", () => {
  const results = queryExercises({ muscle: "abs", limit: 100 });

  assert(
    results.total > 0,
    "Expected exercises targeting or supporting the abs",
  );
  assert(
    results.items.every((exercise) =>
      [exercise.target, exercise.muscleGroup, ...exercise.secondaryMuscles]
        .some((muscle) => muscle.toLowerCase() === "abs")
    ),
    "Expected every result to match the requested muscle",
  );
});
