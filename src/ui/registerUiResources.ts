import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RESOURCE_MIME_TYPE, UI_URIS } from "./constants.js";
import { marketValueHtml, recallsHtml, vehicleCardHtml } from "./widgetHtml.js";

function registerHtmlResource(
  server: McpServer,
  name: string,
  uri: string,
  description: string,
  html: () => string,
): void {
  server.registerResource(
    name,
    uri,
    {
      description,
      mimeType: RESOURCE_MIME_TYPE,
    },
    async () => ({
      contents: [
        {
          uri,
          mimeType: RESOURCE_MIME_TYPE,
          text: html(),
          _meta: {
            ui: { prefersBorder: true },
          },
        },
      ],
    }),
  );
}

export function registerUiResources(server: McpServer): void {
  registerHtmlResource(
    server,
    "carsxe-vehicle-card",
    UI_URIS.vehicleCard,
    "Inline vehicle identity and key-specs card",
    vehicleCardHtml,
  );
  registerHtmlResource(
    server,
    "carsxe-market-value",
    UI_URIS.marketValue,
    "Inline market-value band card",
    marketValueHtml,
  );
  registerHtmlResource(
    server,
    "carsxe-recalls",
    UI_URIS.recalls,
    "Inline open-recalls card",
    recallsHtml,
  );
}
