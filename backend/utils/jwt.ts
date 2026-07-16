import { loadEnv } from "../deps.ts";

try {
  await loadEnv({ export: true, examplePath: null });
} catch (_error) {
  // Hosted environments provide configuration without a local .env file.
}

const secret = Deno.env.get("JWT_SECRET");

if (!secret) {
  throw new Error(
    "JWT_SECRET is required. Refusing to start with an insecure JWT configuration.",
  );
}

export const jwtKey = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-512" },
  false,
  ["sign", "verify"],
);
