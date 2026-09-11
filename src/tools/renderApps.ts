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
        "Render a visual vehicle identity card (VIN + key specs). Always call get_vehicle_specs first, then pass that tool's structuredContent fields here. Do not remount this UI on every specs fetch — only call this render tool when the user should see the card.",
      inputSchema: vehicleCardSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
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
        "Render a visual market-value card with retail and trade-in bands. Always call get_market_value first, then pass that tool's structuredContent fields here. Do not attach UI to the data tool or remount this card on every valuation fetch.",
      inputSchema: marketValueCardSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
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
        "Render a visual open-recalls card. Always call get_vehicle_recalls first, then pass that tool's structuredContent (vin, hasRecalls, recallCount, recalls[]) here. Do not remount this UI on every recall fetch.",
      inputSchema: recallsCardSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
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
