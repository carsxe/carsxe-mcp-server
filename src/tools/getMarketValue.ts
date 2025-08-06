import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXEMarketValueResponse } from "../types/carsxe.js";
import { formatMarketValueResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetMarketValueTool(
  server: McpServer,
  getApiKey: () => string | null
) {
  server.tool(
    "get-market-value",
    "Get the estimated market value for a vehicle by VIN",
    {
      vin: z
        .string()
        .min(17)
        .max(17)
        .describe("17-character Vehicle Identification Number"),
      state: z.string().optional().describe("US state abbreviation (optional)"),
      country: z
        .string()
        .optional()
        .describe("Country code (optional, default: US)"),
    },
    async ({ vin, state, country }) => {
      const params: Record<string, string> = { vin };
      if (state) params.state = state;
      if (country) params.country = country;
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

      const data = await carsxeApiRequest<CarsXEMarketValueResponse>(
        "v2/marketvalue",
        params,
        apiKey
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve market value. Please check the VIN and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatMarketValueResponse(data),
          },
        ],
      };
    }
  );
}
