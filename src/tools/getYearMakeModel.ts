import { z } from "zod";
import { CarsXEYearMakeModelResponse } from "../types/carsxe.js";
import { formatYearMakeModelResponse } from "../formatters/carsxe.js";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetYearMakeModelTool(
  server: McpServer,
  getApiKey: () => string | null
) {
  server.tool(
    "get-year-make-model",
    "Get comprehensive vehicle info by year, make, model, and optional trim",
    {
      year: z
        .string()
        .describe("Manufacturing year of the vehicle (e.g., 2023)"),
      make: z.string().describe("Vehicle make (e.g., Toyota)"),
      model: z.string().describe("Vehicle model (e.g., Camry)"),
      trim: z
        .string()
        .optional()
        .describe("Vehicle trim (optional, e.g., XLE)"),
    },
    async ({ year, make, model, trim }) => {
      const params: Record<string, string> = { year, make, model };
      if (trim) params.trim = trim;
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

      const data = (await carsxeApiRequest<CarsXEYearMakeModelResponse>(
        "v1/ymm",
        params,
        apiKey
      )) as CarsXEYearMakeModelResponse;
      if (!data || !data.success) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Year/Make/Model lookup failed. ${
                data?.message || "Unknown error."
              }`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatYearMakeModelResponse(data),
          },
        ],
      };
    }
  );
}
