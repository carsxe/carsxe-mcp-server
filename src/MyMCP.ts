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

// Simple approach: store API key in a global variable
// This works in Cloudflare Workers because each request runs in its own isolate
let currentApiKey: string | null = null;

export function setApiKey(apiKey: string) {
  currentApiKey = apiKey;
  console.log("Setting API key:", apiKey ? "***" + apiKey.slice(-4) : "null");
}

export function getApiKey(): string | null {
  console.log("Getting API key:", currentApiKey ? "***" + currentApiKey.slice(-4) : "null");
  return currentApiKey;
}

export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "carsxe",
    version: "1.0.1",
  });

  async init() {
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
