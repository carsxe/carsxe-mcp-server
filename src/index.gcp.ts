import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
	classifyIncomingCredential,
	isChatgptOauthSurface,
} from "./chatgptSurface.js";
import {
	handleOAuthRequest,
	resolveAccessToken,
	sendUnauthorized,
} from "./oauth.js";
import { publicAsset } from "./publicAssets.js";
import { registerAllTools } from "./registerTools.js";
import { mcpServerInfo } from "./serverInfo.js";

const PORT = parseInt(process.env.PORT ?? "8080", 10);
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
	if (cached && Date.now() - cached.timestamp < CACHE_TTL)
		return cached.allowed;
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

function headerValue(value: string | string[] | undefined): string | null {
	if (Array.isArray(value)) return value[0] ?? null;
	return value ?? null;
}

const httpServer = http.createServer(async (req, res) => {
	const url = new URL(req.url ?? "/", "http://localhost");

	if (url.pathname === "/health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ status: "ok" }));
		return;
	}

	const asset = publicAsset(url.pathname);
	if (asset && (req.method === "GET" || req.method === "HEAD")) {
		res.writeHead(200, {
			"Content-Type": asset.contentType,
			"Cache-Control": "public, max-age=86400",
			"Content-Length": asset.body.length,
		});
		if (req.method === "HEAD") res.end();
		else res.end(asset.body);
		return;
	}

	if (url.pathname === "/.well-known/openai-apps-challenge") {
		res.writeHead(200, { "Content-Type": "text/plain" });
		res.end(OPENAI_APPS_CHALLENGE_TOKEN);
		return;
	}

	// OAuth 2.1 discovery + endpoints (Claude.ai custom connector support).
	if (await handleOAuthRequest(req, res, url)) return;

	if (url.pathname !== "/mcp") {
		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Not found");
		return;
	}

	const credential = classifyIncomingCredential({
		xApiKey: headerValue(req.headers["x-api-key"]),
		authorization: headerValue(req.headers.authorization),
		queryKey: url.searchParams.get("key"),
		userAgent: headerValue(req.headers["user-agent"]),
	});
	let apiKey: string | null = null;
	let chatgptSurface = false;
	if (credential.kind === "oauth") {
		const resolved = await resolveAccessToken(credential.secret);
		if (!resolved) {
			sendUnauthorized(res, "Access token is invalid, expired, or revoked");
			return;
		}
		apiKey = resolved.apiKey;
		chatgptSurface = isChatgptOauthSurface({
			oauthAccessToken: true,
			userAgent: credential.userAgent,
			audience: resolved.audience,
		});
	} else if (credential.kind === "api-key") {
		apiKey = credential.secret;
	}
	if (!apiKey) {
		// 401 + WWW-Authenticate triggers OAuth-capable MCP clients to start
		// the authorization flow; X-API-Key clients are unaffected.
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

	const mcpServer = new McpServer(mcpServerInfo());
	const getApiKey = () => apiKey;

	registerAllTools(mcpServer, getApiKey, { chatgptSurface });

	const transport = new StreamableHTTPServerTransport({
		sessionIdGenerator: undefined, // stateless — no session affinity required
	});

	res.on("close", async () => {
		await transport.close();
		await mcpServer.close();
	});

	await mcpServer.connect(transport);

	await transport.handleRequest(req, res);
});

httpServer.listen(PORT, () => {
	console.log(`CarsXE MCP server listening on port ${PORT}`);
});
