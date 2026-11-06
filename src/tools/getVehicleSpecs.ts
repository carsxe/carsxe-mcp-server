import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXESpecsResponse } from "../types/carsxe.js";
import { formatVehicleSpecsResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toVehicleCard } from "../ui/cards.js";

export function registerGetVehicleSpecsTool(
  server: McpServer,
  getApiKey: () => string | null,
) {
  server.registerTool(
    "get_vehicle_specs",
    {
      title: "Get Vehicle Specs",
      description:
        "Get comprehensive vehicle specifications by VIN. Returns Markdown plus structuredContent (vin, year, make, model, and key specs).",
      inputSchema: {
        vin: z
          .string()
          .min(17)
          .max(17)
          .describe("17-character Vehicle Identification Number"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ vin }) => {
      const apiKey = getApiKey();
      console.log(
        "apiKey getVehicleSpecs",
        apiKey ? `***${apiKey.slice(-4)}` : "null",
      );
      if (!apiKey) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "❌ API key not provided. Please ensure X-API-Key header is set.",
            },
          ],
        };
      }

      const specsData = await carsxeApiRequest<CarsXESpecsResponse>(
        "specs",
        {
          vin,
        },
        apiKey,
      );
      if (!specsData || !specsData.success) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve vehicle specifications. Please check the VIN and try again.",
            },
          ],
        };
      }
      const structuredContent = toVehicleCard(specsData);
      return {
        structuredContent,
        content: [
          {
            type: "text",
            text: formatVehicleSpecsResponse(specsData),
          },
        ],
      };
    },
  );
}
