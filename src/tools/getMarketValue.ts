import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXEMarketValueResponse } from "../types/carsxe.js";
import { formatMarketValueResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toMarketValueCard } from "../ui/cards.js";

export function registerGetMarketValueTool(
  server: McpServer,
  getApiKey: () => string | null,
) {
  server.registerTool(
    "get_market_value",
    {
      title: "Get Market Value",
      description:
        "Get the estimated market value for a vehicle by VIN. Data tool only: returns Markdown plus structuredContent (retail/trade-in bands) for chaining. Do not expect UI from this tool. After fetching, call render_market_value with the structured result when the user should see the value card.",
      inputSchema: {
        vin: z
          .string()
          .min(17)
          .max(17)
          .describe("17-character Vehicle Identification Number"),
        state: z
          .string()
          .optional()
          .describe("US state abbreviation (optional)"),
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
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ vin, state, mileage, condition }) => {
      const params: Record<string, string> = { vin };
      if (state) params.state = state;
      if (mileage !== undefined) params.mileage = String(mileage);
      if (condition) params.condition = condition;
      const apiKey = getApiKey();
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

      const data = await carsxeApiRequest<CarsXEMarketValueResponse>(
        "v2/marketvalue",
        params,
        apiKey,
      );
      if (!data) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve market value. Please check the VIN and try again.",
            },
          ],
        };
      }
      const structuredContent = toMarketValueCard(data);
      return {
        structuredContent,
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
