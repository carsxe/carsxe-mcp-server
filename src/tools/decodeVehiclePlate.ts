import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXEPlateDecoderResponse } from "../types/carsxe.js";
import { formatPlateDecoderResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerDecodeVehiclePlateTool(server: McpServer) {
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
      const data = await carsxeApiRequest<CarsXEPlateDecoderResponse>(
        "v2/platedecoder",
        { plate, state, country }
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
