import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { handleGoogleConnectedApps } from "./googleConnectedApps.js";
import {
  handleOAuthRequest,
  isOAuthAccessToken,
  resolveAccessToken,
  sendUnauthorized,
} from "./oauth.js";
import { registerAllTools } from "./registerTools.js";
import { createCarsxeMcpServer } from "./serverInfo.js";

const OPENAI_APPS_CHALLENGE_TOKEN =
  "-3tlD4Y2M-gfl0ViGmFQh1BkavSNU0HZxcqlvpWA6Fk";

const STAGING = process.env.STAGING === "true";
const CARSXE_AUTH_URL =
  process.env.CARSXE_AUTH_URL ?? "https://api.carsxe.com/v1/auth/validate";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  allowed: boolean;
  timestamp: number;
}
const authCache = new Map<string, CacheEntry>();

async function isAllowedOnStaging(apiKey: string): Promise<boolean> {
  const cached = authCache.get(apiKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.allowed;
  try {
    const res = await fetch(`${CARSXE_AUTH_URL}?key=${apiKey}`);
    const data = (await res.json()) as {
      success: boolean;
      active: boolean;
      user: { email: string };
    };
    const allowed =
      data.success && data.active && data.user?.email?.endsWith("@carsxe.com");
    authCache.set(apiKey, { allowed, timestamp: Date.now() });
    return allowed;
  } catch {
    return false;
  }
}

function extractApiKey(req: http.IncomingMessage, url: URL): string | null {
  const xApiKey = req.headers["x-api-key"];
  if (xApiKey) return Array.isArray(xApiKey) ? xApiKey[0] : xApiKey;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return url.searchParams.get("key");
}

export async function handleHttpRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (url.pathname === "/.well-known/openai-apps-challenge") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(OPENAI_APPS_CHALLENGE_TOKEN);
    return;
  }

  if (handleGoogleConnectedApps(req, res, url)) return;

  // OAuth 2.1 discovery + endpoints (Claude.ai custom connector support).
  if (await handleOAuthRequest(req, res, url)) return;

  if (url.pathname !== "/mcp") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  let apiKey = extractApiKey(req, url);
  if (apiKey && isOAuthAccessToken(apiKey)) {
    // OAuth bearer token — resolve to the user's CarsXE API key.
    apiKey = await resolveAccessToken(apiKey);
    if (!apiKey) {
      sendUnauthorized(res, "Access token is invalid, expired, or revoked");
      return;
    }
  }
  if (!apiKey) {
    // RFC 9728 / MCP OAuth 2.1: unauthenticated POST /mcp (including
    // initialize and tools/list) MUST 401 with WWW-Authenticate so clients
    // can discover protected-resource metadata. Do not allow an anonymous
    // initialize/tools/list bypass — that would break Claude, ChatGPT, and
    // Google Connected Apps OAuth.
    sendUnauthorized(
      res,
      "Missing credentials. Provide an OAuth Bearer token, X-API-Key header, or 'key' query parameter",
    );
    return;
  }

  if (STAGING) {
    const allowed = await isAllowedOnStaging(apiKey);
    if (!allowed) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Staging is restricted to CarsXE team members only");
      return;
    }
  }

  const mcpServer = createCarsxeMcpServer();
  const getApiKey = () => apiKey;

  registerAllTools(mcpServer, getApiKey);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session affinity required
  });

  res.on("close", async () => {
    await transport.close();
    await mcpServer.close();
  });

  await mcpServer.connect(transport);

  await transport.handleRequest(req, res);
}

export function createCarsxeHttpServer(): http.Server {
  return http.createServer((req, res) => {
    void handleHttpRequest(req, res);
  });
}
