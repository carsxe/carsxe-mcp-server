import { z } from "zod";
import { CarsXEPlateRecognitionResponse } from "../types/carsxe.js";
import { formatPlateRecognitionResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as dotenv from "dotenv";
// import * as path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, "../../.env") });

export function registerRecognizePlateImageTool(
  server: McpServer,
  getApiKey: () => string | null
) {
  server.tool(
    "recognize-plate-image",
    "Recognize and extract license plate(s) from a vehicle image URL",
    {
      imageUrl: z
        .string()
        .url()
        .describe("Direct URL to an image of a vehicle's license plate"),
    },
    async ({ imageUrl }) => {
      if (!imageUrl) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Plate recognition failed. Image URL is required.",
            },
          ],
        };
      }
      // POST request with body as imageUrl
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

      const CARSXE_API_BASE = "https://api.carsxe.com";
      const url = `${CARSXE_API_BASE}/platerecognition?key=${apiKey}`;
      let data: CarsXEPlateRecognitionResponse | null = null;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: imageUrl,
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        data = await response.json();
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Plate recognition failed. ${
                error instanceof Error
                  ? error.message
                  : String(error) || "Unknown error."
              }`,
            },
          ],
        };
      }
      if (!data || !data.success) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Plate recognition failed. ${
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
            text: formatPlateRecognitionResponse(data),
          },
        ],
      };
    }
  );
}
