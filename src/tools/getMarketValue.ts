import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXEMarketValueResponse } from "../types/carsxe.js";
import { formatMarketValueResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetMarketValueTool(
  server: McpServer,
  getApiKey: () => string | null,
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
      mileage: z
        .number()
        .optional()
        .describe(
          "Current mileage of the vehicle used to adjust the market value (optional)",
        ),
      condition: z
        .enum(["excellent", "clean", "average", "rough"])
        .optional()
        .describe(
          "Overall condition of the vehicle: excellent, clean, average, or rough (optional)",
        ),
    },
    async ({ vin, state, mileage, condition }) => {
      const params: Record<string, string> = { vin };
      if (state) params.state = state;
      if (mileage !== undefined) params.mileage = String(mileage);
      if (condition) params.condition = condition;
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
        apiKey,
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
    },
  );
}
