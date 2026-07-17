import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ANATOME_REPOSITORY = "https://github.com/Rippy1911/anatome.git";
const ANATOME_REVISION = "f117b127dc82fa0c9a8e7e21c7df41ad43154dac";
const EXPECTED_GIF_COUNT = 873;

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const generatedDirectory = join(projectDirectory, ".generated");
const publicDirectory = join(generatedDirectory, "public");
const gifsDirectory = join(publicDirectory, "gifs");
const revisionMarker = join(generatedDirectory, "anatome-revision.txt");

function gifCount(directory) {
  if (!existsSync(directory)) return 0;
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".gif"))
    .length;
}

function runGit(workingDirectory, ...args) {
  const result = spawnSync("git", ["-C", workingDirectory, ...args], {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

const preparedRevision = existsSync(revisionMarker)
  ? readFileSync(revisionMarker, "utf8").trim()
  : "";

if (
  preparedRevision === ANATOME_REVISION &&
  gifCount(gifsDirectory) === EXPECTED_GIF_COUNT
) {
  console.log(`Anatome GIF bundle ${ANATOME_REVISION} is already prepared.`);
  process.exit(0);
}

rmSync(generatedDirectory, { recursive: true, force: true });
mkdirSync(generatedDirectory, { recursive: true });

const checkoutDirectory = mkdtempSync(join(tmpdir(), "vitality-anatome-"));
try {
  runGit(checkoutDirectory, "init", "--quiet");
  runGit(checkoutDirectory, "remote", "add", "origin", ANATOME_REPOSITORY);
  runGit(checkoutDirectory, "config", "core.sparseCheckout", "true");

  const sparseCheckoutFile = join(
    checkoutDirectory,
    ".git",
    "info",
    "sparse-checkout",
  );
  mkdirSync(dirname(sparseCheckoutFile), { recursive: true });
  writeFileSync(sparseCheckoutFile, "/api/public/gifs/\n", "utf8");

  runGit(
    checkoutDirectory,
    "fetch",
    "--quiet",
    "--depth",
    "1",
    "origin",
    ANATOME_REVISION,
  );
  runGit(checkoutDirectory, "checkout", "--quiet", "--detach", "FETCH_HEAD");

  const sourceDirectory = join(
    checkoutDirectory,
    "api",
    "public",
    "gifs",
  );
  cpSync(sourceDirectory, gifsDirectory, { recursive: true });

  const preparedCount = gifCount(gifsDirectory);
  if (preparedCount !== EXPECTED_GIF_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_GIF_COUNT} Anatome GIFs, found ${preparedCount}`,
    );
  }

  writeFileSync(revisionMarker, `${ANATOME_REVISION}\n`, "utf8");
  console.log(
    `Prepared ${preparedCount} CC0 Anatome GIFs from ${ANATOME_REVISION}.`,
  );
} finally {
  rmSync(checkoutDirectory, { recursive: true, force: true });
}

