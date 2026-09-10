import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import type { CarsXERecallsYmmResponse } from "../types/carsxe.js";
import { formatRecallsYmmResponse } from "../formatters/carsxe.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetRecallsByYmmTool(
  server: McpServer,
  getApiKey: () => string | null,
) {
  server.registerTool(
    "get_recalls_by_ymm",
    {
      title: "Get Recalls by Year Make Model",
      description:
        "Get safety recall information by year, make, and model (no VIN required)",
      inputSchema: {
        year: z
          .string()
          .describe("4-digit model year (e.g., 2019). Must be 1900 or later."),
        make: z.string().describe("Vehicle make (e.g., Toyota)"),
        model: z.string().describe("Vehicle model (e.g., Camry)"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ year, make, model }) => {
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

      const data = await carsxeApiRequest<CarsXERecallsYmmResponse>(
        "v1/recalls-ymm",
        { year, make, model },
        apiKey,
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve YMM recall information. Please check the year, make, and model and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatRecallsYmmResponse(data),
          },
        ],
      };
    },
  );
}
