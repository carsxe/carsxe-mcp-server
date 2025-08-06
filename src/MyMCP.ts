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

// Store API key globally with timestamp-based cleanup to prevent memory leaks
const apiKeyStore: {
  [requestId: string]: { apiKey: string; timestamp: number };
} = {};

export function setApiKeyForRequest(requestId: string, apiKey: string) {
  // Clean up old entries (older than 5 minutes)
  const now = Date.now();
  Object.keys(apiKeyStore).forEach((id) => {
    if (now - apiKeyStore[id].timestamp > 5 * 60 * 1000) {
      delete apiKeyStore[id];
    }
  });

  apiKeyStore[requestId] = { apiKey, timestamp: now };
  console.log(
    "Setting API key for request:",
    requestId,
    apiKey ? "***" + apiKey.slice(-4) : "null"
  );
}

export function getApiKeyForRequest(requestId: string): string | null {
  const entry = apiKeyStore[requestId];
  const apiKey = entry?.apiKey || null;
  console.log(
    "Getting API key for request:",
    requestId,
    apiKey ? "***" + apiKey.slice(-4) : "null"
  );
  return apiKey;
}

export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "carsxe",
    version: "1.0.1",
  });

  private static currentRequestId: string | null = null;

  static setRequestId(requestId: string) {
    MyMCP.currentRequestId = requestId;
  }

  static getCurrentRequestId(): string | null {
    return MyMCP.currentRequestId;
  }

  async init() {
    const getApiKey = () => {
      const requestId = MyMCP.getCurrentRequestId();
      console.log(
        "requestId",
        requestId,
        requestId ? getApiKeyForRequest(requestId) : null
      );
      return requestId ? getApiKeyForRequest(requestId) : null;
    };

    registerGetVehicleSpecsTool(this.server, getApiKey);
    registerDecodeVehiclePlateTool(this.server, getApiKey);
    registerInternationalVinDecoderTool(this.server, getApiKey);
    registerGetMarketValueTool(this.server, getApiKey);
    registerGetVehicleHistoryTool(this.server, getApiKey);
    registerGetVehicleImagesTool(this.server, getApiKey);
    registerGetVehicleRecallsTool(this.server, getApiKey);
    registerVinOcrTool(this.server, getApiKey);
    registerGetYearMakeModelTool(this.server, getApiKey);
    registerDecodeObdCodeTool(this.server, getApiKey);
    registerRecognizePlateImageTool(this.server, getApiKey);
  }
}
