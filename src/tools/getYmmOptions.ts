import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import type { CarsXEYmmOptionsResponse } from "../types/carsxe.js";
import { formatYmmOptionsResponse } from "../formatters/carsxe.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetYmmOptionsTool(
  server: McpServer,
  getApiKey: () => string | null,
) {
  server.registerTool(
    "get_ymm_options",
    {
      title: "Get Year Make Model Options",
      description:
        "List cascading year, make, model, trim, or variant options for dropdowns. Omit filters to list years; add year for makes, make for models, then model for variants.",
      inputSchema: {
        dimension: z
          .enum(["years", "makes", "models", "trims", "variants"])
          .optional()
          .describe(
            "Force one list: years, makes, models, trims, or variants. When omitted, the layer is inferred from the filters.",
          ),
        year: z.string().optional().describe("Filter by model year"),
        make: z
          .string()
          .optional()
          .describe("Filter by make (required for models)"),
        model: z
          .string()
          .optional()
          .describe("Filter by model (required for trims; used for variants)"),
        trim: z
          .string()
          .optional()
          .describe("Substring filter on trim or variant names"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ dimension, year, make, model, trim }) => {
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

      const params: Record<string, string> = {};
      if (dimension) params.dimension = dimension;
      if (year) params.year = year;
      if (make) params.make = make;
      if (model) params.model = model;
      if (trim) params.trim = trim;

      const data = await carsxeApiRequest<CarsXEYmmOptionsResponse>(
        "v1/ymm-options",
        params,
        apiKey,
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve YMM options. Please check the filters and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatYmmOptionsResponse(data),
          },
        ],
      };
    },
  );
}
