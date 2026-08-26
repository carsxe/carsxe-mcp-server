import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXEHistoryResponse } from "../types/carsxe.js";
import { formatHistoryResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetVehicleHistoryTool(
  server: McpServer,
  getApiKey: () => string | null,
) {
  server.registerTool(
    "get_vehicle_history",
    {
      title: "Get Vehicle History",
      description: "Get a comprehensive vehicle history report by VIN",
      inputSchema: {
        vin: z
          .string()
          .min(17)
          .max(17)
          .describe("17-character Vehicle Identification Number"),
        format: z
          .string()
          .optional()
          .describe("Response format (json or xml, default: json)"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async ({ vin, format }) => {
      const params: Record<string, string> = { vin };
      if (format) params.format = format;
      const apiKey = getApiKey();
      if (!apiKey) {
        return {
          content: [
            {
              type: "text",
              text: "❌ API key not provided. Please ensure X-API-Key header is set.",
            },
          ],
        };
      }

      const data = await carsxeApiRequest<CarsXEHistoryResponse>(
        "history",
        params,
        apiKey,
      );
      if (!data || !data.success) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve vehicle history. Please check the VIN and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatHistoryResponse(data),
          },
        ],
      };
    },
  );
}
