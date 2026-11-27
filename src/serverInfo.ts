import type { Implementation } from "@modelcontextprotocol/sdk/types.js";

/**
 * Same-origin PNG served by the Cloud Run host.
 * Clients are told to load icons from the MCP server's own host.
 */
export const SERVER_ICON_URL = "https://mcp.carsxe.com/logo.png";

export function mcpServerInfo(): Implementation {
  return {
    name: "carsxe",
    version: "1.0.1",
    icons: [
      {
        src: SERVER_ICON_URL,
        mimeType: "image/png",
        sizes: ["256x256"],
      },
    ],
  };
}
