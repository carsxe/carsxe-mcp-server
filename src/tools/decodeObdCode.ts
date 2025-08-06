import { z } from "zod";
import { CarsXEObdCodeResponse } from "../types/carsxe.js";
import { formatObdCodeResponse } from "../formatters/carsxe.js";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerDecodeObdCodeTool(
  server: McpServer,
  getApiKey: () => string | null
) {
  server.tool(
    "decode-obd-code",
    "Decode an OBD code and get diagnosis information",
    {
      code: z.string().describe("OBD code to decode (e.g., P0115)"),
    },
    async ({ code }) => {
      if (!code) {
        return {
          content: [
            {
              type: "text",
              text: "❌ OBD code lookup failed. Code is required.",
            },
          ],
        };
      }
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

      const data = (await carsxeApiRequest<CarsXEObdCodeResponse>(
        "obdcodesdecoder",
        { code },
        apiKey
      )) as CarsXEObdCodeResponse;
      if (!data || !data.success) {
        return {
          content: [
            {
              type: "text",
              text: `❌ OBD code lookup failed.`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatObdCodeResponse(data),
          },
        ],
      };
    }
  );
}
