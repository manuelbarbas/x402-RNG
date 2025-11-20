import { serve } from "bun";
import index from "./index.html";
import { getRandomWord } from "./skale-base-sepolia";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async OPTIONS() {
        return respondToOptions("GET, PUT, OPTIONS");
      },
      async GET(req) {
        return jsonWithCors({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return jsonWithCors({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return jsonWithCors({
        message: `Hello, ${name}!`,
      });
    },

    "/api/random-word": {
      async OPTIONS() {
        return respondToOptions("POST, OPTIONS");
      },
      async POST(req) {
        try {
          const body = await readJson(req);
          const wordLength = (body as { wordLength?: unknown })?.wordLength;
          return handleRequest(() => getRandomWord(wordLength ?? 5));
        } catch (error) {
          return respondWithError(error);
        }
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

async function readJson(req: Request): Promise<unknown> {
  const raw = await req.text();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new TypeError("Request body must be valid JSON");
  }
}

async function handleRequest<T>(callback: () => Promise<T>): Promise<Response> {
  try {
    const result = await callback();
    return jsonWithCors(result);
  } catch (error) {
    return respondWithError(error);
  }
}

function respondWithError(error: unknown): Response {
  if (error instanceof TypeError) {
    return jsonWithCors({ error: error.message }, { status: 400 });
  }

  const status = isErrorWithStatus(error) ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return jsonWithCors({ error: message }, { status });
}

function isErrorWithStatus(error: unknown): error is Error & { status: number } {
  return typeof (error as { status?: unknown })?.status === "number";
}

function createCorsHeaders(overrides?: HeadersInit): Headers {
  const headers = new Headers(CORS_HEADERS);

  if (overrides) {
    const entries = overrides instanceof Headers
      ? overrides.entries()
      : Array.isArray(overrides)
        ? overrides
        : Object.entries(overrides);

    for (const [key, value] of entries) {
      headers.set(key, value);
    }
  }

  return headers;
}

function jsonWithCors(body: unknown, init?: ResponseInit): Response {
  const headers = createCorsHeaders(init?.headers);
  return Response.json(body, { ...init, headers });
}

function respondToOptions(allowedMethods: string): Response {
  const headers = createCorsHeaders({ "Access-Control-Allow-Methods": allowedMethods });
  return new Response(null, { status: 204, headers });
}
