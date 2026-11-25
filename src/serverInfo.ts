import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const MCP_SERVER_NAME = "carsxe";
export const MCP_SERVER_VERSION = "1.2.0";
export const MCP_SERVER_INSTRUCTIONS =
  "CarsXE provides vehicle data. Use it when the user gives a VIN (17 characters), a license plate with state or country, a year/make/model, an OBD-II trouble code, or a photo of a VIN plate or license plate, and wants specs, recalls, market value, history, images, lien/theft status, or a code explanation. Send only the identifiers needed for the lookup.";

export function createCarsxeMcpServer(): McpServer {
  return new McpServer(
    { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    { instructions: MCP_SERVER_INSTRUCTIONS },
  );
}
