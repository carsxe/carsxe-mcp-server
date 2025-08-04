import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
import { MCP_OBJECT } from "./MCP_OBJECT";

const server = new McpServer({
  name: "carsxe",
  version: "1.0.1",
  capabilities: {
    resources: {},
    tools: {},
  },
});

registerGetVehicleSpecsTool(server);
registerDecodeVehiclePlateTool(server);
registerInternationalVinDecoderTool(server);
registerGetMarketValueTool(server);
registerGetVehicleHistoryTool(server);
registerGetVehicleImagesTool(server);
registerGetVehicleRecallsTool(server);
registerVinOcrTool(server);
registerGetYearMakeModelTool(server);
registerDecodeObdCodeTool(server);
registerRecognizePlateImageTool(server);

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("🚀 Vehicle Specs MCP Server v1.0.1 running on stdio");
  } catch (error) {
    console.error("💥 Failed to start server:", error);
    process.exit(1);
  }
}

main();

export default {
  async fetch(
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> {
    return new Response("MCP server is live");
  },
};

export { MCP_OBJECT };
