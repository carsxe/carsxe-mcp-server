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

export class MCP_OBJECT {
  server: McpServer;

  constructor(readonly state: DurableObjectState, readonly env: any) {
    this.server = new McpServer({
      name: "carsxe",
      version: "1.0.1",
      capabilities: {
        tools: {},
        resources: {},
      },
    });

    registerGetVehicleSpecsTool(this.server);
    registerDecodeVehiclePlateTool(this.server);
    registerInternationalVinDecoderTool(this.server);
    registerGetMarketValueTool(this.server);
    registerGetVehicleHistoryTool(this.server);
    registerGetVehicleImagesTool(this.server);
    registerGetVehicleRecallsTool(this.server);
    registerVinOcrTool(this.server);
    registerGetYearMakeModelTool(this.server);
    registerDecodeObdCodeTool(this.server);
    registerRecognizePlateImageTool(this.server);
  }

  async fetch(request: Request): Promise<Response> {
    // Extract request payload and headers
    const body = request.method === "GET" ? undefined : await request.text();
    const { url, method, headers } = request;

    const mcpreq = new Request(url, {
      method,
      headers,
      body,
    });

    // Use the server to respond to the request
    const response = await this.server.handleRequest(mcpreq);
    return response;
  }
}
