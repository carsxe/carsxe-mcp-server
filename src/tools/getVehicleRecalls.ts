import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXERecallsResponse } from "../types/carsxe.js";
import { formatRecallsResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetVehicleRecallsTool(
  server: McpServer,
  getApiKey: () => string | null
) {
  server.tool(
    "get-vehicle-recalls",
    "Get vehicle recall information by VIN",
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

      const data = await carsxeApiRequest<CarsXERecallsResponse>(
        "v1/recalls",
        {
          vin,
        },
        apiKey
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve recall information. Please check the VIN and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatRecallsResponse(data),
          },
        ],
      };
    }
  );
}
