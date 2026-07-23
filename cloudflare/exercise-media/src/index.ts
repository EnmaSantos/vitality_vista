import {
  ANATOME_REVISION,
  exerciseImageSourceUrl,
  FREE_EXERCISE_DB_REVISION,
  sanitizeExerciseImagePath,
} from "./exerciseMedia";

const LONG_CACHE = "public, max-age=86400, s-maxage=604800, immutable";

interface Env {
  ASSETS: Fetcher;
}

function publicHeaders(existing?: HeadersInit): Headers {
  const headers = new Headers(existing);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  return headers;
}

function json(body: unknown, status = 200): Response {
  const headers = publicHeaders({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": status === 200 ? "public, max-age=300" : "no-store",
  });
  return new Response(JSON.stringify(body), { status, headers });
}

function publicResponse(response: Response, cacheControl = LONG_CACHE): Response {
  const headers = publicHeaders(response.headers);
  headers.set("Cache-Control", cacheControl);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function exerciseGif(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim() ?? "";
  if (!id) return json({ ok: false, error: "id is required" }, 400);
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return json({ ok: false, error: "invalid exercise id" }, 400);
  }

  const assetUrl = new URL(request.url);
  assetUrl.pathname = `/gifs/${id}.gif`;
  assetUrl.search = "";
  const asset = await env.ASSETS.fetch(new Request(assetUrl, request));
  if (!asset.ok) {
    return json({ ok: false, error: "exercise GIF not found", id }, 404);
  }

  const response = publicResponse(asset);
  response.headers.set("Content-Type", "image/gif");
  return response;
}

async function exerciseImage(
  request: Request,
  context: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);
  const path = sanitizeExerciseImagePath(url.searchParams.get("path"));
  const upstreamUrl = exerciseImageSourceUrl(path);
  if (!path || !upstreamUrl) {
    return json({ ok: false, error: "invalid exercise image path" }, 400);
  }

  const cacheKey = new Request(url.toString(), { method: "GET" });
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(upstreamUrl, {
    headers: { Accept: "image/jpeg" },
  });
  if (!upstream.ok || !upstream.body) {
    return json(
      { ok: false, error: "exercise image not found", path },
      404,
    );
  }

  const response = publicResponse(upstream);
  response.headers.set(
    "Content-Type",
    upstream.headers.get("Content-Type") || "image/jpeg",
  );
  context.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    context: ExecutionContext,
  ): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: publicHeaders() });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ ok: false, error: "method not allowed" }, 405);
    }

    const url = new URL(request.url);
    if (url.pathname === "/exerciseGif") return exerciseGif(request, env);
    if (url.pathname === "/exerciseImage") {
      return exerciseImage(request, context);
    }
    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "vitality-exercise-media",
        exercises: 873,
        anatomeRevision: ANATOME_REVISION,
        freeExerciseDbRevision: FREE_EXERCISE_DB_REVISION,
        dataAndMediaLicense: "CC0-1.0",
      });
    }

    return json({
      ok: true,
      service: "vitality-exercise-media",
      endpoints: [
        "/health",
        "/exerciseGif?id=Air_Bike",
        "/exerciseImage?path=Air_Bike%2F0.jpg",
      ],
      source: "https://github.com/Rippy1911/anatome",
      license: "CC0-1.0 exercise data and media",
    });
  },
} satisfies ExportedHandler<Env>;

