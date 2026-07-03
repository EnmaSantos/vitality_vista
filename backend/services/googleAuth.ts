const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const CLOCK_SKEW_SECONDS = 60;

interface GoogleJwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

interface GoogleJwtPayload {
  iss?: string;
  aud?: string;
  exp?: number | string;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}

interface GoogleJwk extends JsonWebKey {
  kid: string;
  kty: string;
  n: string;
  e: string;
}

interface GoogleCertsResponse {
  keys: GoogleJwk[];
}

export interface VerifiedGoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  givenName: string | null;
  familyName: string | null;
  name: string | null;
  picture: string | null;
}

let cachedKeys: { keys: GoogleJwk[]; expiresAt: number } | null = null;

function decodeBase64Url(segment: string): Uint8Array {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function decodeBase64UrlJson<T>(segment: string): T {
  const json = new TextDecoder().decode(decodeBase64Url(segment));
  return JSON.parse(json) as T;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function getCacheMaxAge(cacheControl: string | null): number {
  const match = cacheControl?.match(/max-age=(\d+)/i);
  return match ? Number(match[1]) : 3600;
}

async function getGoogleKeys(forceRefresh = false): Promise<GoogleJwk[]> {
  const now = Date.now();
  if (!forceRefresh && cachedKeys && cachedKeys.expiresAt > now) {
    return cachedKeys.keys;
  }

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) {
    throw new Error("Unable to fetch Google signing keys");
  }

  const certs = await response.json() as GoogleCertsResponse;
  const maxAge = getCacheMaxAge(response.headers.get("cache-control"));

  cachedKeys = {
    keys: certs.keys,
    expiresAt: now + Math.max(maxAge, 300) * 1000,
  };

  return cachedKeys.keys;
}

async function findGoogleKey(kid: string): Promise<GoogleJwk> {
  let key = (await getGoogleKeys()).find((candidate) => candidate.kid === kid);

  if (!key) {
    key = (await getGoogleKeys(true)).find((candidate) => candidate.kid === kid);
  }

  if (!key) {
    throw new Error("Google signing key not found");
  }

  return key;
}

async function verifySignature(
  encodedHeader: string,
  encodedPayload: string,
  encodedSignature: string,
  jwk: GoogleJwk,
): Promise<boolean> {
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    toArrayBuffer(decodeBase64Url(encodedSignature)),
    toArrayBuffer(new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)),
  );
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(message);
  }

  return value;
}

export async function verifyGoogleIdToken(credential: string): Promise<VerifiedGoogleProfile> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")?.trim();
  if (!clientId) {
    throw new Error("Google auth is not configured");
  }

  const parts = credential.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid Google credential");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeBase64UrlJson<GoogleJwtHeader>(encodedHeader);
  const payload = decodeBase64UrlJson<GoogleJwtPayload>(encodedPayload);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Unsupported Google credential signature");
  }

  const jwk = await findGoogleKey(header.kid);
  const isSignatureValid = await verifySignature(
    encodedHeader,
    encodedPayload,
    encodedSignature,
    jwk,
  );

  if (!isSignatureValid) {
    throw new Error("Invalid Google credential signature");
  }

  if (!payload.iss || !GOOGLE_ISSUERS.has(payload.iss)) {
    throw new Error("Invalid Google credential issuer");
  }

  if (payload.aud !== clientId) {
    throw new Error("Invalid Google credential audience");
  }

  const expiresAt = Number(payload.exp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(expiresAt) || expiresAt < now - CLOCK_SKEW_SECONDS) {
    throw new Error("Google credential has expired");
  }

  const sub = requireString(payload.sub, "Google credential is missing a subject");
  const email = requireString(payload.email, "Google credential is missing an email").toLowerCase();
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";

  if (!emailVerified) {
    throw new Error("Google email is not verified");
  }

  return {
    sub,
    email,
    emailVerified,
    givenName: payload.given_name ?? null,
    familyName: payload.family_name ?? null,
    name: payload.name ?? null,
    picture: payload.picture ?? null,
  };
}
