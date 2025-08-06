import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXEInternationalVinDecoderResponse } from "../types/carsxe.js";
import { formatInternationalVinDecoderResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerInternationalVinDecoderTool(
  server: McpServer,
  getApiKey: () => string | null
) {
  server.tool(
    "international-vin-decoder",
    "Decode an international VIN and get detailed vehicle info",
    {
      vin: z
        .string()
        .min(17)
        .max(17)
        .describe("17-character Vehicle Identification Number"),
    },
    async ({ vin }) => {
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

      const data =
        await carsxeApiRequest<CarsXEInternationalVinDecoderResponse>(
          "v1/international-vin-decoder",
          { vin },
          apiKey
        );
      if (!data || !data.success) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to decode international VIN. Please check the VIN and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatInternationalVinDecoderResponse(data),
          },
        ],
      };
    }
  );
}
