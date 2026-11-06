import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  marketValueCardSchema,
  recallsCardSchema,
  vehicleCardSchema,
} from "../ui/cards.js";
import { UI_URIS, uiToolMeta } from "../ui/constants.js";
import { registerUiResources } from "../ui/registerUiResources.js";

export function registerAppsUi(server: McpServer): void {
  registerUiResources(server);
  registerRenderVehicleCardTool(server);
  registerRenderMarketValueTool(server);
  registerRenderRecallsTool(server);
}

export function registerRenderVehicleCardTool(server: McpServer): void {
  server.registerTool(
    "render_vehicle_card",
    {
      title: "Render Vehicle Card",
      description:
        "Display a visual vehicle identity card from a VIN and key spec fields (year, make, model, trim, engine). Use when the user wants to see a card.",
      inputSchema: vehicleCardSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      _meta: uiToolMeta(UI_URIS.vehicleCard),
    },
    async (data) => {
      const title = [data.year, data.make, data.model, data.trim]
        .filter(Boolean)
        .join(" ");
      return {
        structuredContent: data,
        content: [
          {
            type: "text",
            text: title
              ? `Showing vehicle card for ${title} (${data.vin}).`
              : `Showing vehicle card for VIN ${data.vin}.`,
          },
        ],
      };
    },
  );
}

export function registerRenderMarketValueTool(server: McpServer): void {
  server.registerTool(
    "render_market_value",
    {
      title: "Render Market Value",
      description:
        "Display a visual market-value card from retail and trade-in value bands for a VIN.",
      inputSchema: marketValueCardSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      _meta: uiToolMeta(UI_URIS.marketValue),
    },
    async (data) => {
      const title = [data.year, data.make, data.model]
        .filter(Boolean)
        .join(" ");
      return {
        structuredContent: data,
        content: [
          {
            type: "text",
            text: title
              ? `Showing market value bands for ${title} (${data.vin}).`
              : `Showing market value bands for VIN ${data.vin}.`,
          },
        ],
      };
    },
  );
}

export function registerRenderRecallsTool(server: McpServer): void {
  server.registerTool(
    "render_recalls",
    {
      title: "Render Recalls",
      description:
        "Display a visual open-recalls card from a VIN, recall count, and recall list.",
      inputSchema: recallsCardSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      _meta: uiToolMeta(UI_URIS.recalls),
    },
    async (data) => {
      const count = data.recallCount ?? data.recalls?.length ?? 0;
      return {
        structuredContent: data,
        content: [
          {
            type: "text",
            text: data.hasRecalls
              ? `Showing ${count} recall${count === 1 ? "" : "s"} for VIN ${data.vin}.`
              : `Showing recalls card for VIN ${data.vin}: no open recalls.`,
          },
        ],
      };
    },
  );
}
