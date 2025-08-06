import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXEPlateDecoderResponse } from "../types/carsxe.js";
import { formatPlateDecoderResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerDecodeVehiclePlateTool(
  server: McpServer,
  getApiKey: () => string | null
) {
  server.tool(
    "decode-vehicle-plate",
    "Decode a vehicle's license plate to get VIN and basic vehicle info",
    {
      plate: z.string().min(1).describe("License plate number"),
      state: z.string().min(2).max(2).describe("State abbreviation (e.g., CA)"),
      country: z
        .string()
        .min(2)
        .max(2)
        .default("US")
        .describe("Country code (default: US)"),
    },
    async ({ plate, state, country }) => {
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

      const data = await carsxeApiRequest<CarsXEPlateDecoderResponse>(
        "v2/platedecoder",
        { plate, state, country },
        apiKey
      );
      if (!data || !data.success) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to decode license plate. Please check the plate and state.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatPlateDecoderResponse(data),
          },
        ],
      };
    }
  );
}
