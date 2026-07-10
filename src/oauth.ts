import { createHash } from "node:crypto";
import type http from "node:http";

/**
 * OAuth 2.1 surface for the hosted MCP server (GCP Cloud Run deployment).
 *
 * mcp.carsxe.com is the authorization-server *issuer*, but the actual OAuth
 * logic (dynamic client registration, consent, code + token issuance) lives
 * in the CarsXE web app, next to the user/API-key data it needs:
 *
 *   GET  /.well-known/oauth-authorization-server  → served here (RFC 8414)
 *   GET  /.well-known/oauth-protected-resource    → served here (MCP spec)
 *   POST /oauth/register  → proxied to  {WEB_BASE}/api/auth/mcp/register
 *   GET  /oauth/authorize → 302 to      {WEB_BASE}/mcp-auth?<query>
 *   POST /oauth/token     → proxied to  {WEB_BASE}/api/auth/mcp/token
 *
 * Incoming `Authorization: Bearer mcp_at_*` tokens on /mcp are resolved to
 * the user's CarsXE API key via the web app's internal introspection
 * endpoint (shared-secret protected), with a short in-memory cache.
 */

const ISSUER = (process.env.OAUTH_ISSUER ?? "https://mcp.carsxe.com").replace(
	/\/$/,
	"",
);
const WEB_BASE = (
	process.env.OAUTH_WEB_BASE ?? "https://api.carsxe.com"
).replace(/\/$/, "");
const INTERNAL_SECRET = process.env.MCP_OAUTH_INTERNAL_SECRET ?? "";

const CORS_HEADERS: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers":
		"Content-Type, Authorization, mcp-protocol-version",
	"Access-Control-Max-Age": "86400",
};

function sendJson(
	res: http.ServerResponse,
	status: number,
	body: unknown,
): void {
	res.writeHead(status, {
		"Content-Type": "application/json",
		"Cache-Control": "no-store",
		...CORS_HEADERS,
	});
	res.end(JSON.stringify(body));
}

function authorizationServerMetadata() {
	return {
		issuer: ISSUER,
		authorization_endpoint: `${ISSUER}/oauth/authorize`,
		token_endpoint: `${ISSUER}/oauth/token`,
		registration_endpoint: `${ISSUER}/oauth/register`,
		response_types_supported: ["code"],
		grant_types_supported: ["authorization_code", "refresh_token"],
		code_challenge_methods_supported: ["S256"],
		token_endpoint_auth_methods_supported: ["none"],
		scopes_supported: ["mcp"],
	};
}

function protectedResourceMetadata() {
	return {
		resource: `${ISSUER}/mcp`,
		authorization_servers: [ISSUER],
		bearer_methods_supported: ["header"],
		scopes_supported: ["mcp"],
	};
}

function readBody(req: http.IncomingMessage): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;
		req.on("data", (chunk: Buffer) => {
			size += chunk.length;
			if (size > 64 * 1024) {
				reject(new Error("Request body too large"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => resolve(Buffer.concat(chunks)));
		req.on("error", reject);
	});
}

/** Forwards register/token requests to the web app, preserving status + body. */
async function proxyToWeb(
	req: http.IncomingMessage,
	res: http.ServerResponse,
	targetPath: string,
): Promise<void> {
	let body: Buffer;
	try {
		body = await readBody(req);
	} catch {
		sendJson(res, 400, {
			error: "invalid_request",
			error_description: "Request body too large",
		});
		return;
	}

	try {
		const upstream = await fetch(`${WEB_BASE}${targetPath}`, {
			method: "POST",
			headers: {
				"Content-Type": req.headers["content-type"] ?? "application/json",
				// Preserve the caller's IP so the web app's rate limiting keys on
				// the real client rather than this proxy.
				"X-Forwarded-For":
					(Array.isArray(req.headers["x-forwarded-for"])
						? req.headers["x-forwarded-for"][0]
						: req.headers["x-forwarded-for"]) ??
					req.socket.remoteAddress ??
					"unknown",
			},
			body: new Uint8Array(body),
		});
		const text = await upstream.text();
		res.writeHead(upstream.status, {
			"Content-Type":
				upstream.headers.get("content-type") ?? "application/json",
			"Cache-Control": "no-store",
			...CORS_HEADERS,
		});
		res.end(text);
	} catch (error) {
		console.error(`OAuth proxy to ${targetPath} failed:`, error);
		sendJson(res, 502, {
			error: "temporarily_unavailable",
			error_description: "Authorization service is unavailable",
		});
	}
}

/**
 * Handles OAuth discovery and endpoint routes. Returns true when the
 * request was an OAuth route (response already sent), false otherwise.
 */
export async function handleOAuthRequest(
	req: http.IncomingMessage,
	res: http.ServerResponse,
	url: URL,
): Promise<boolean> {
	const path = url.pathname;

	// RFC 8414 discovery. Claude.ai may request the path-inserted variant
	// (".../oauth-authorization-server/mcp") for a server URL with a path.
	const isAuthServerMeta =
		path === "/.well-known/oauth-authorization-server" ||
		path === "/.well-known/oauth-authorization-server/mcp";
	const isResourceMeta =
		path === "/.well-known/oauth-protected-resource" ||
		path === "/.well-known/oauth-protected-resource/mcp";
	const isOauthPath =
		path === "/oauth/register" ||
		path === "/oauth/token" ||
		path === "/oauth/authorize";

	if (!isAuthServerMeta && !isResourceMeta && !isOauthPath) return false;

	if (req.method === "OPTIONS") {
		res.writeHead(204, CORS_HEADERS);
		res.end();
		return true;
	}

	if (isAuthServerMeta) {
		sendJson(res, 200, authorizationServerMetadata());
		return true;
	}
	if (isResourceMeta) {
		sendJson(res, 200, protectedResourceMetadata());
		return true;
	}

	if (path === "/oauth/authorize") {
		if (req.method !== "GET") {
			sendJson(res, 405, {
				error: "invalid_request",
				error_description: "Use GET",
			});
			return true;
		}
		// The consent page re-validates every parameter server-side.
		res.writeHead(302, {
			Location: `${WEB_BASE}/mcp-auth${url.search}`,
			"Cache-Control": "no-store",
		});
		res.end();
		return true;
	}

	if (req.method !== "POST") {
		sendJson(res, 405, {
			error: "invalid_request",
			error_description: "Use POST",
		});
		return true;
	}
	if (path === "/oauth/register") {
		await proxyToWeb(req, res, "/api/auth/mcp/register");
		return true;
	}
	await proxyToWeb(req, res, "/api/auth/mcp/token");
	return true;
}

// Introspection results cached briefly so steady-state MCP traffic does not
// hit the web app on every request. Keyed by token hash — never the token.
interface CachedIntrospection {
	apiKey: string | null;
	cachedAt: number;
}
const introspectionCache = new Map<string, CachedIntrospection>();
const INTROSPECTION_CACHE_TTL_MS = 60 * 1000;

export function isOAuthAccessToken(token: string): boolean {
	return token.startsWith("mcp_at_");
}

/**
 * Resolves an OAuth access token to the user's CarsXE API key, or null if
 * the token is invalid, expired, or revoked.
 */
export async function resolveAccessToken(
	token: string,
): Promise<string | null> {
	if (!INTERNAL_SECRET) {
		console.error(
			"MCP_OAUTH_INTERNAL_SECRET is not set; rejecting OAuth bearer token",
		);
		return null;
	}

	const cacheKey = createHash("sha256").update(token).digest("hex");
	const cached = introspectionCache.get(cacheKey);
	if (cached && Date.now() - cached.cachedAt < INTROSPECTION_CACHE_TTL_MS) {
		return cached.apiKey;
	}

	try {
		const res = await fetch(`${WEB_BASE}/api/auth/mcp/introspect`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Internal-Secret": INTERNAL_SECRET,
			},
			body: JSON.stringify({ token }),
		});
		if (!res.ok) return null; // don't cache transient upstream failures
		const data = (await res.json()) as {
			active: boolean;
			api_key?: string | null;
		};
		const apiKey = data.active && data.api_key ? data.api_key : null;
		introspectionCache.set(cacheKey, { apiKey, cachedAt: Date.now() });
		if (introspectionCache.size > 10_000) {
			for (const [key, value] of introspectionCache) {
				if (Date.now() - value.cachedAt >= INTROSPECTION_CACHE_TTL_MS) {
					introspectionCache.delete(key);
				}
			}
		}
		return apiKey;
	} catch (error) {
		console.error("Token introspection failed:", error);
		return null;
	}
}

/**
 * 401 challenge per the MCP authorization spec — the WWW-Authenticate
 * header pointing at the protected-resource metadata is what triggers
 * OAuth-capable clients (Claude.ai) to start the flow.
 */
export function sendUnauthorized(
	res: http.ServerResponse,
	description: string,
): void {
	res.writeHead(401, {
		"Content-Type": "application/json",
		"WWW-Authenticate": `Bearer realm="CarsXE MCP", resource_metadata="${ISSUER}/.well-known/oauth-protected-resource", error="invalid_token", error_description="${description}"`,
		...CORS_HEADERS,
	});
	res.end(
		JSON.stringify({ error: "unauthorized", error_description: description }),
	);
}
