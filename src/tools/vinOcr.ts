import { z } from "zod";
import { CarsXEVinOcrResponse } from "../types/carsxe.js";
import { formatVinOcrResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as dotenv from "dotenv";
// import * as path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, "../../.env") });

export function registerVinOcrTool(server: McpServer) {
  server.tool(
    "vin-ocr",
    "Recognize and extract the VIN from a vehicle image URL using OCR",
    {
      imageUrl: z
        .string()
        .url()
        .describe("Direct URL to an image of a vehicle's VIN (photo or scan)"),
    },
    async ({ imageUrl }) => {
      if (!imageUrl) {
        return {
          content: [
            {
              type: "text",
              text: "❌ VIN OCR failed. Image URL is required.",
            },
          ],
        };
      }
      // POST request with body as imageUrl
      const API_KEY = process.env.CARSXE_API_KEY!;
      const CARSXE_API_BASE = "https://api.carsxe.com";
      const url = `${CARSXE_API_BASE}/vinocr?key=${API_KEY}`;
      let data: CarsXEVinOcrResponse | null = null;
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
              text: `❌ VIN OCR failed. ${
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
              text: `❌ VIN OCR failed. ${data?.message || "Unknown error."}`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatVinOcrResponse(data),
          },
        ],
      };
    }
  );
}
