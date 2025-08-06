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

export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "carsxe",
    version: "1.0.1",
  });

  async init() {
    // Try accessing request from server context
    const getApiKeyFromServer = (): string | null => {
      // Check if server has access to request context
      console.log("Server context:", typeof (this.server as any).request);
      console.log("Server keys:", Object.keys(this.server));

      // Try different ways to access the original request
      const serverAny = this.server as any;
      if (serverAny.request) {
        const apiKey =
          serverAny.request.headers?.get?.("X-API-Key") ||
          serverAny.request.headers?.get?.("x-api-key");
        console.log(
          "API key from server request:",
          apiKey ? "***" + apiKey.slice(-4) : "null"
        );
        return apiKey;
      }

      console.log("No request context found in server");
      return null;
    };

    registerGetVehicleSpecsTool(this.server, getApiKeyFromServer);
    registerDecodeVehiclePlateTool(this.server, getApiKeyFromServer);
    registerInternationalVinDecoderTool(this.server, getApiKeyFromServer);
    registerGetMarketValueTool(this.server, getApiKeyFromServer);
    registerGetVehicleHistoryTool(this.server, getApiKeyFromServer);
    registerGetVehicleImagesTool(this.server, getApiKeyFromServer);
    registerGetVehicleRecallsTool(this.server, getApiKeyFromServer);
    registerVinOcrTool(this.server, getApiKeyFromServer);
    registerGetYearMakeModelTool(this.server, getApiKeyFromServer);
    registerDecodeObdCodeTool(this.server, getApiKeyFromServer);
    registerRecognizePlateImageTool(this.server, getApiKeyFromServer);
  }
}
