import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import type { CarsXERecallCampaignResponse } from "../types/carsxe.js";
import { formatRecallCampaignResponse } from "../formatters/carsxe.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetRecallCampaignTool(
  server: McpServer,
  getApiKey: () => string | null,
) {
  server.registerTool(
    "get_recall_campaign",
    {
      title: "Get Recall Campaign",
      description:
        "Look up a manufacturer recall campaign code (e.g. Volkswagen 37M2) and get the recall campaign behind it: NHTSA campaign number, recall or bulletin type, description, component, and affected models and model years. No VIN required. Use get_vehicle_recalls to check a specific VIN.",
      inputSchema: {
        make: z
          .string()
          .min(1)
          .max(120)
          .describe("Vehicle make (e.g., Volkswagen). Case-insensitive."),
        code: z
          .string()
          .min(1)
          .max(64)
          .describe(
            "Manufacturer campaign code as printed on a repair order or owner letter (e.g., 37M2). Case-insensitive; the letter O is read as zero.",
          ),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ make, code }) => {
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

      const data = await carsxeApiRequest<CarsXERecallCampaignResponse>(
        "v1/recalls-campaigns",
        { make, code },
        apiKey,
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve the recall campaign. Please check the make and campaign code and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatRecallCampaignResponse(data),
          },
        ],
      };
    },
  );
}
