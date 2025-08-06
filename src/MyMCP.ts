import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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

// Global API key storage with additional timing information for debugging
interface ApiKeyEntry {
  apiKey: string;
  timestamp: number;
  requestCounter: number;
}

let globalApiKeyEntry: ApiKeyEntry | null = null;
let requestCounter = 0;

export function setGlobalApiKey(apiKey: string) {
  requestCounter++;
  globalApiKeyEntry = {
    apiKey,
    timestamp: Date.now(),
    requestCounter
  };
  console.log(`[Request ${requestCounter}] Setting global API key:`, apiKey ? "***" + apiKey.slice(-4) : "null", `at ${globalApiKeyEntry.timestamp}`);
}

export function getGlobalApiKey(): string | null {
  if (!globalApiKeyEntry) {
    console.log("Getting global API key: null (no entry)");
    return null;
  }
  
  const { apiKey, timestamp, requestCounter: reqId } = globalApiKeyEntry;
  const age = Date.now() - timestamp;
  console.log(`[Request ${reqId}] Getting global API key:`, apiKey ? "***" + apiKey.slice(-4) : "null", `(age: ${age}ms)`);
  
  // If the API key is older than 30 seconds, consider it stale
  if (age > 30000) {
    console.log("API key is stale, returning null");
    return null;
  }
  
  return apiKey;
}

export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "carsxe",
    version: "1.0.1",
  });

  async init() {
    registerGetVehicleSpecsTool(this.server, getGlobalApiKey);
    registerDecodeVehiclePlateTool(this.server, getGlobalApiKey);
    registerInternationalVinDecoderTool(this.server, getGlobalApiKey);
    registerGetMarketValueTool(this.server, getGlobalApiKey);
    registerGetVehicleHistoryTool(this.server, getGlobalApiKey);
    registerGetVehicleImagesTool(this.server, getGlobalApiKey);
    registerGetVehicleRecallsTool(this.server, getGlobalApiKey);
    registerVinOcrTool(this.server, getGlobalApiKey);
    registerGetYearMakeModelTool(this.server, getGlobalApiKey);
    registerDecodeObdCodeTool(this.server, getGlobalApiKey);
    registerRecognizePlateImageTool(this.server, getGlobalApiKey);
  }
}
