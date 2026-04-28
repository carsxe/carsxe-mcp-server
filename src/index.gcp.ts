import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerGetVehicleSpecsTool } from "./tools/getVehicleSpecs.js";
import { registerDecodeVehiclePlateTool } from "./tools/decodeVehiclePlate.js";
import { registerInternationalVinDecoderTool } from "./tools/internationalVinDecoder.js";
import { registerGetMarketValueTool } from "./tools/getMarketValue.js";
import { registerGetVehicleHistoryTool } from "./tools/getVehicleHistory.js";
import { registerGetVehicleImagesTool } from "./tools/getVehicleImages.js";
import { registerGetVehicleRecallsTool } from "./tools/getVehicleRecalls.js";
import { registerVinOcrTool } from "./tools/vinOcr.js";
import { registerGetYearMakeModelTool } from "./tools/getYearMakeModel.js";
import { registerDecodeObdCodeTool } from "./tools/decodeObdCode.js";
import { registerRecognizePlateImageTool } from "./tools/recognizePlateImage.js";
import { registerGetLienTheftTool } from "./tools/getLienTheft.js";

const PORT = parseInt(process.env.PORT ?? "8080", 10);

const STAGING = process.env.STAGING === "true";
const CARSXE_AUTH_URL = process.env.CARSXE_AUTH_URL ?? "https://api.carsxe.com/v1/auth/validate";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CacheEntry { allowed: boolean; timestamp: number; }
const authCache = new Map<string, CacheEntry>();

async function isAllowedOnStaging(apiKey: string): Promise<boolean> {
  const cached = authCache.get(apiKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.allowed;
  try {
    const res = await fetch(`${CARSXE_AUTH_URL}?key=${apiKey}`);
    const data = await res.json() as { success: boolean; active: boolean; user: { email: string } };
    const allowed = data.success && data.active && data.user?.email?.endsWith("@carsxe.com");
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

function registerAllTools(server: McpServer, getApiKey: () => string | null): void {
  registerGetVehicleSpecsTool(server, getApiKey);
  registerDecodeVehiclePlateTool(server, getApiKey);
  registerInternationalVinDecoderTool(server, getApiKey);
  registerGetMarketValueTool(server, getApiKey);
  registerGetVehicleHistoryTool(server, getApiKey);
  registerGetVehicleImagesTool(server, getApiKey);
  registerGetVehicleRecallsTool(server, getApiKey);
  registerVinOcrTool(server, getApiKey);
  registerGetYearMakeModelTool(server, getApiKey);
  registerDecodeObdCodeTool(server, getApiKey);
  registerRecognizePlateImageTool(server, getApiKey);
  registerGetLienTheftTool(server, getApiKey);
}

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (url.pathname !== "/mcp") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  const apiKey = extractApiKey(req, url);
  if (!apiKey) {
    res.writeHead(401, { "Content-Type": "text/plain" });
    res.end(
      "Missing API key. Provide via X-API-Key header, Authorization Bearer token, or 'key' query parameter",
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

  const mcpServer = new McpServer({ name: "carsxe", version: "1.0.1" });
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
});

httpServer.listen(PORT, () => {
  console.log(`CarsXE MCP server listening on port ${PORT}`);
});
