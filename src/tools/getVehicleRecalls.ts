import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXERecallsResponse } from "../types/carsxe.js";
import { formatRecallsResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toRecallsCard } from "../ui/cards.js";

export function registerGetVehicleRecallsTool(
  server: McpServer,
  getApiKey: () => string | null,
) {
  server.registerTool(
    "get_vehicle_recalls",
    {
      title: "Get Vehicle Recalls",
      description:
        "Get vehicle recall information by VIN. Data tool only: returns Markdown plus structuredContent (hasRecalls, recallCount, recalls[]) for chaining. Do not expect UI from this tool. After fetching, call render_recalls with the structured result when the user should see the recalls card.",
      inputSchema: {
        vin: z
          .string()
          .min(17)
          .max(17)
          .describe("17-character Vehicle Identification Number"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ vin }) => {
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

      const data = await carsxeApiRequest<CarsXERecallsResponse>(
        "v1/recalls",
        {
          vin,
        },
        apiKey,
      );
      if (!data) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve recall information. Please check the VIN and try again.",
            },
          ],
        };
      }
      const structuredContent = toRecallsCard(data);
      return {
        structuredContent,
        content: [
          {
            type: "text",
            text: formatRecallsResponse(data),
          },
        ],
      };
    },
  );
}
