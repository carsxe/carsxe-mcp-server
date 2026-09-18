import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDecodeObdCodeTool } from "./tools/decodeObdCode.js";
import { registerDecodeVehiclePlateTool } from "./tools/decodeVehiclePlate.js";
import { registerGetLienTheftTool } from "./tools/getLienTheft.js";
import { registerGetRecallsByYmmTool } from "./tools/getRecallsByYmm.js";
import { registerGetMarketValueTool } from "./tools/getMarketValue.js";
import { registerGetVehicleHistoryTool } from "./tools/getVehicleHistory.js";
import { registerGetVehicleImagesTool } from "./tools/getVehicleImages.js";
import { registerGetVehicleRecallsTool } from "./tools/getVehicleRecalls.js";
import { registerGetVehicleSpecsTool } from "./tools/getVehicleSpecs.js";
import { registerGetYearMakeModelTool } from "./tools/getYearMakeModel.js";
import { registerInternationalVinDecoderTool } from "./tools/internationalVinDecoder.js";
import { registerRecognizePlateImageTool } from "./tools/recognizePlateImage.js";
import { registerVinOcrTool } from "./tools/vinOcr.js";
import { registerGetYmmOptionsTool } from "./tools/getYmmOptions.js";
import { registerOwnershipTools } from "./tools/ownership.js";
import { registerRecallsBatchTools } from "./tools/recallsBatch.js";
import { registerAppsUi } from "./tools/renderApps.js";

export function registerAllTools(
  server: McpServer,
  getApiKey: () => string | null,
): void {
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
  registerGetRecallsByYmmTool(server, getApiKey);
  registerRecallsBatchTools(server, getApiKey);
  registerGetYmmOptionsTool(server, getApiKey);
  registerOwnershipTools(server, getApiKey);
  registerAppsUi(server);
}

export type RegisteredToolAnnotations = {
  readOnlyHint?: boolean | null;
  openWorldHint?: boolean | null;
  destructiveHint?: boolean | null;
};

export function getRegisteredTools(server: McpServer): Record<
  string,
  {
    annotations?: RegisteredToolAnnotations;
    _meta?: Record<string, unknown>;
  }
> {
  return (
    server as unknown as {
      _registeredTools: Record<
        string,
        {
          annotations?: RegisteredToolAnnotations;
          _meta?: Record<string, unknown>;
        }
      >;
    }
  )._registeredTools;
}

export function getRegisteredResources(
  server: McpServer,
): Record<string, { metadata?: { mimeType?: string } }> {
  return (
    server as unknown as {
      _registeredResources: Record<
        string,
        { metadata?: { mimeType?: string } }
      >;
    }
  )._registeredResources;
}
