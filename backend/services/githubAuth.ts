const GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";
const GITHUB_API_VERSION = "2026-03-10";
const GITHUB_USER_AGENT = "vitality-vista";

const DEFAULT_ALLOWED_REDIRECT_URIS = [
  "http://localhost:3000/auth/github/callback",
  "http://localhost:5173/auth/github/callback",
  "https://vitality-vista.vercel.app/auth/github/callback",
  "https://vitality-vista.enmasantos.dev/auth/github/callback",
];

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

interface GitHubUserResponse {
  id?: number | string;
  login?: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface GitHubEmailResponse {
  email?: string;
  primary?: boolean;
  verified?: boolean;
  visibility?: string | null;
}

export interface VerifiedGitHubProfile {
  id: string;
  login: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface GitHubCodeVerificationOptions {
  redirectUri?: string;
  codeVerifier?: string;
}

function getEnv(name: string): string {
  return Deno.env.get(name)?.trim() || "";
}

function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw new Error("GitHub auth is not configured");
  }

  return value;
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getAllowedRedirectUris(): Set<string> {
  const configuredUris = [
    ...parseCsv(getEnv("GITHUB_ALLOWED_REDIRECT_URIS")),
    getEnv("GITHUB_REDIRECT_URI"),
  ].filter(Boolean);

  return new Set(configuredUris.length > 0 ? configuredUris : DEFAULT_ALLOWED_REDIRECT_URIS);
}

function validateRedirectUri(redirectUri?: string): string | undefined {
  const normalizedRedirectUri = redirectUri?.trim();
  if (!normalizedRedirectUri) {
    return undefined;
  }

  if (!getAllowedRedirectUris().has(normalizedRedirectUri)) {
    throw new Error("GitHub redirect URI is not allowed");
  }

  return normalizedRedirectUri;
}

function getGitHubHeaders(accessToken: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": GITHUB_USER_AGENT,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

function getJsonErrorMessage(payload: GitHubTokenResponse): string {
  return payload.error_description || payload.error || "GitHub token exchange failed";
}

async function exchangeCodeForToken(
  code: string,
  redirectUri?: string,
  codeVerifier?: string,
): Promise<string> {
  const clientId = requireEnv("GITHUB_CLIENT_ID");
  const clientSecret = requireEnv("GITHUB_CLIENT_SECRET");
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });

  if (redirectUri) {
    params.set("redirect_uri", redirectUri);
  }

  if (codeVerifier?.trim()) {
    params.set("code_verifier", codeVerifier.trim());
  }

  const response = await fetch(GITHUB_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": GITHUB_USER_AGENT,
    },
    body: params,
  });

  let payload: GitHubTokenResponse;
  try {
    payload = await response.json() as GitHubTokenResponse;
  } catch (_error) {
    throw new Error("GitHub token exchange returned an invalid response");
  }

  if (!response.ok || payload.error || !payload.access_token) {
    throw new Error(getJsonErrorMessage(payload));
  }

  return payload.access_token;
}

async function fetchGitHubUser(accessToken: string): Promise<GitHubUserResponse> {
  const response = await fetch(GITHUB_USER_URL, {
    headers: getGitHubHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error("Unable to fetch GitHub user profile");
  }

  return await response.json() as GitHubUserResponse;
}

async function fetchVerifiedGitHubEmail(accessToken: string): Promise<string> {
  const response = await fetch(GITHUB_EMAILS_URL, {
    headers: getGitHubHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error("Unable to fetch GitHub email addresses");
  }

  const emails = await response.json() as GitHubEmailResponse[];
  const verifiedPrimary = emails.find((entry) => entry.primary && entry.verified && entry.email);
  const verifiedFallback = emails.find((entry) => entry.verified && entry.email);
  const selectedEmail = verifiedPrimary?.email || verifiedFallback?.email;

  if (!selectedEmail) {
    throw new Error("GitHub account does not have a verified email address available");
  }

  return selectedEmail.toLowerCase();
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(message);
  }

  return value;
}

export async function verifyGitHubCode(
  code: string,
  options: GitHubCodeVerificationOptions = {},
): Promise<VerifiedGitHubProfile> {
  const normalizedCode = requireString(code, "GitHub authorization code is required");
  const redirectUri = validateRedirectUri(options.redirectUri);
  const accessToken = await exchangeCodeForToken(
    normalizedCode,
    redirectUri,
    options.codeVerifier,
  );
  const [user, email] = await Promise.all([
    fetchGitHubUser(accessToken),
    fetchVerifiedGitHubEmail(accessToken),
  ]);

  const id = String(user.id || "").trim();
  if (!id) {
    throw new Error("GitHub user profile is missing an id");
  }

  return {
    id,
    login: requireString(user.login, "GitHub user profile is missing a login"),
    email,
    name: user.name ?? null,
    avatarUrl: user.avatar_url ?? null,
  };
}
