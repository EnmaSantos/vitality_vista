import { GITHUB_CLIENT_ID, getGitHubRedirectUri } from '../config';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_OAUTH_STATE_KEY = 'vitalityVista.githubOAuthState';
const GITHUB_OAUTH_CODE_VERIFIER_KEY = 'vitalityVista.githubOAuthCodeVerifier';
const GITHUB_OAUTH_REDIRECT_URI_KEY = 'vitalityVista.githubOAuthRedirectUri';

export interface StoredGitHubOAuthRequest {
  state: string;
  codeVerifier: string;
  redirectUri: string;
}

function assertCryptoAvailable() {
  if (!window.crypto?.getRandomValues || !window.crypto?.subtle) {
    throw new Error('GitHub login requires a secure browser context.');
  }
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createRandomString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await window.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  );

  return base64UrlEncode(new Uint8Array(digest));
}

export function getStoredGitHubOAuthRequest(): StoredGitHubOAuthRequest | null {
  const state = sessionStorage.getItem(GITHUB_OAUTH_STATE_KEY);
  const codeVerifier = sessionStorage.getItem(GITHUB_OAUTH_CODE_VERIFIER_KEY);
  const redirectUri = sessionStorage.getItem(GITHUB_OAUTH_REDIRECT_URI_KEY);

  if (!state || !codeVerifier || !redirectUri) {
    return null;
  }

  return { state, codeVerifier, redirectUri };
}

export function clearStoredGitHubOAuthRequest() {
  sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY);
  sessionStorage.removeItem(GITHUB_OAUTH_CODE_VERIFIER_KEY);
  sessionStorage.removeItem(GITHUB_OAUTH_REDIRECT_URI_KEY);
}

export async function startGitHubOAuth() {
  if (!GITHUB_CLIENT_ID) {
    throw new Error('GitHub login is not configured.');
  }

  assertCryptoAvailable();

  const state = createRandomString();
  const codeVerifier = createRandomString();
  const redirectUri = getGitHubRedirectUri();
  const codeChallenge = await createCodeChallenge(codeVerifier);

  sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, state);
  sessionStorage.setItem(GITHUB_OAUTH_CODE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(GITHUB_OAUTH_REDIRECT_URI_KEY, redirectUri);

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.assign(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`);
}
