import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import { CarsXEImagesResponse } from "../types/carsxe.js";
import { formatImagesResponse } from "../formatters/carsxe.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGetVehicleImagesTool(
  server: McpServer,
  getApiKey: () => string | null
) {
  server.tool(
    "get-vehicle-images",
    "Get vehicle images by make, model, and optional filters",
    {
      make: z.string().describe("Vehicle make (required)"),
      model: z.string().describe("Vehicle model (required)"),
      year: z.string().optional().describe("Vehicle year (optional)"),
      trim: z.string().optional().describe("Vehicle trim (optional)"),
      color: z.string().optional().describe("Vehicle color (optional)"),
      transparent: z
        .boolean()
        .optional()
        .describe("Transparent background (optional)"),
      angle: z
        .string()
        .optional()
        .describe("Angle: front, side, back (optional)"),
      photoType: z
        .string()
        .optional()
        .describe("interior, exterior, engine (optional)"),
      size: z
        .string()
        .optional()
        .describe("Small, Medium, Large, Wallpaper, All (optional)"),
      license: z
        .string()
        .optional()
        .describe(
          "Public, Share, ShareCommercially, Modify, ModifyCommercially (optional)"
        ),
      format: z
        .string()
        .optional()
        .describe("json or xml (optional, default: json)"),
    },
    async (params) => {
      // Convert all params to string for the API
      const stringParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === "boolean") {
          stringParams[key] = value ? "true" : "false";
        } else if (value !== undefined) {
          stringParams[key] = String(value);
        }
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

      const data = await carsxeApiRequest<CarsXEImagesResponse>(
        "images",
        stringParams,
        apiKey
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve images. Please check your parameters and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatImagesResponse(data),
          },
        ],
      };
    }
  );
}
