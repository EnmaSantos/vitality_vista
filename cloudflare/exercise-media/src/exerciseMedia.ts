export const ANATOME_REVISION =
  "f117b127dc82fa0c9a8e7e21c7df41ad43154dac";
export const FREE_EXERCISE_DB_REVISION =
  "b0eed061e1c832b3ed815fbaa4b45b3cdc14df49";

const FREE_EXERCISE_DB_RAW_BASE =
  `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${FREE_EXERCISE_DB_REVISION}/exercises/`;

export function sanitizeExerciseImagePath(value: string | null): string | null {
  const path = value?.trim() ?? "";
  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("..") ||
    path.includes("//") ||
    !path.toLowerCase().endsWith(".jpg") ||
    !/^[A-Za-z0-9\-_. /]+$/.test(path)
  ) {
    return null;
  }

  const segments = path.split("/");
  if (
    segments.length < 2 ||
    segments.length > 4 ||
    segments.some((segment) =>
      !segment || segment.startsWith(".") || segment.endsWith(".")
    )
  ) {
    return null;
  }

  return path;
}

export function exerciseImageSourceUrl(value: string | null): string | null {
  const path = sanitizeExerciseImagePath(value);
  if (!path) return null;
  return `${FREE_EXERCISE_DB_RAW_BASE}${
    path.split("/").map(encodeURIComponent).join("/")
  }`;
}
