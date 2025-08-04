import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXESpecsResponse } from "../types/carsxe.js";
import { formatVehicleSpecsResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetVehicleSpecsTool(server: McpServer) {
  server.tool(
    "get-vehicle-specs",
    "Get comprehensive vehicle specifications by VIN",
    {
      vin: z
        .string()
        .min(17)
        .max(17)
        .describe("17-character Vehicle Identification Number"),
    },
    async ({ vin }) => {
      const specsData = await carsxeApiRequest<CarsXESpecsResponse>("specs", {
        vin,
      });
      if (!specsData || !specsData.success) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve vehicle specifications. Please check the VIN and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatVehicleSpecsResponse(specsData),
          },
        ],
      };
    }
  );
}
