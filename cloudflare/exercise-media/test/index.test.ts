import { describe, expect, it } from "vitest";
import {
  ANATOME_REVISION,
  exerciseImageSourceUrl,
  FREE_EXERCISE_DB_REVISION,
  sanitizeExerciseImagePath,
} from "../src/exerciseMedia";

describe("exercise image paths", () => {
  it("accepts Anatome exercise JPG paths", () => {
    expect(sanitizeExerciseImagePath("Air_Bike/0.jpg")).toBe(
      "Air_Bike/0.jpg",
    );
    expect(sanitizeExerciseImagePath("One-Arm Open Palm/1.jpg")).toBe(
      "One-Arm Open Palm/1.jpg",
    );
  });

  it("rejects traversal and non-JPG paths", () => {
    expect(sanitizeExerciseImagePath("../secret.jpg")).toBeNull();
    expect(sanitizeExerciseImagePath("Air_Bike\\0.jpg")).toBeNull();
    expect(sanitizeExerciseImagePath("Air_Bike/0.gif")).toBeNull();
  });

  it("builds a pinned, encoded free-exercise-db URL", () => {
    expect(exerciseImageSourceUrl("One-Arm Open Palm/0.jpg")).toBe(
      `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${FREE_EXERCISE_DB_REVISION}/exercises/One-Arm%20Open%20Palm/0.jpg`,
    );
  });
});

describe("pinned sources", () => {
  it("uses full Git revisions", () => {
    expect(ANATOME_REVISION).toMatch(/^[a-f0-9]{40}$/);
    expect(FREE_EXERCISE_DB_REVISION).toMatch(/^[a-f0-9]{40}$/);
  });
});
