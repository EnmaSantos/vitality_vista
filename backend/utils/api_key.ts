import { loadEnv } from "../deps.ts";

try {
    await loadEnv({ export: true });
} catch (e) {
    // .env might not exist or verifyJwt might be imported in a context where .env isn't needed
    // console.warn("Could not load .env file", e);
}

const jwtSecret = Deno.env.get("JWT_SECRET");

if (!jwtSecret) {
    console.error("CRITICAL: JWT_SECRET is not set. Token verification will fail.");
}

const keySecret = jwtSecret || "fallback-secret-bad-practice";

const encoder = new TextEncoder();
export const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(keySecret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign", "verify"]
);
