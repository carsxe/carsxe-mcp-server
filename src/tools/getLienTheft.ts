import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXELienTheftResponse } from "../types/carsxe.js";
import { formatLienTheftResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetLienTheftTool(
  server: McpServer,
  getApiKey: () => string | null,
) {
  server.tool(
    "get-lien-theft",
    "Get lien and theft information for a vehicle by VIN",
    {
      vin: z
        .string()
        .min(17)
        .max(17)
        .describe("17-character Vehicle Identification Number"),
    },
    async ({ vin }) => {
      const params: Record<string, string> = { vin };
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

      const data = await carsxeApiRequest<CarsXELienTheftResponse>(
        "/v1/lien-theft",
        params,
        apiKey,
      );
      if (!data || !data.success) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve lien-theft information. Please check the VIN and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatLienTheftResponse(data),
          },
        ],
      };
    },
  );
}
