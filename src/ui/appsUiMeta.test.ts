import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getRegisteredResources,
  getRegisteredTools,
  registerAllTools,
} from "../registerTools.js";
import { RESOURCE_MIME_TYPE, UI_URIS, toolHasUiResourceUri } from "./constants.js";

const DATA_TOOLS = [
  "get_vehicle_specs",
  "get_market_value",
  "get_vehicle_recalls",
  "decode_license_plate",
  "decode_international_vin",
  "get_vehicle_history",
  "get_vehicle_images",
  "extract_vin_from_image",
  "get_year_make_model",
  "decode_obd_code",
  "read_license_plate_from_image",
  "check_lien_and_theft",
  "get_recalls_by_ymm",
  "get_ymm_options",
] as const;

const RENDER_TOOLS = {
  render_vehicle_card: UI_URIS.vehicleCard,
  render_market_value: UI_URIS.marketValue,
  render_recalls: UI_URIS.recalls,
} as const;

function createServer() {
  const server = new McpServer({ name: "carsxe-test", version: "1.0.1" });
  registerAllTools(server, () => null);
  return server;
}

describe("MCP Apps UI tool registration", () => {
  it("registers data tools without UI resource meta", () => {
    const tools = getRegisteredTools(createServer());
    for (const name of DATA_TOOLS) {
      assert.ok(tools[name], `expected data tool ${name}`);
      assert.equal(
        toolHasUiResourceUri(tools[name]._meta),
        false,
        `${name} must not declare _meta.ui.resourceUri`,
      );
    }
  });

  it("registers render tools with MCP Apps and ChatGPT UI aliases", () => {
    const tools = getRegisteredTools(createServer());
    for (const [name, uri] of Object.entries(RENDER_TOOLS)) {
      const tool = tools[name];
      assert.ok(tool, `expected render tool ${name}`);
      const meta = tool._meta ?? {};
      const ui = meta.ui as { resourceUri?: string } | undefined;
      assert.equal(ui?.resourceUri, uri);
      assert.equal(meta["openai/outputTemplate"], uri);
      assert.equal(meta["ui/resourceUri"], uri);
    }
  });

  it("render tools echo structuredContent without fetching", async () => {
    const tools = getRegisteredTools(createServer()) as Record<
      string,
      { callback: (args: Record<string, unknown>, extra: unknown) => Promise<{ structuredContent?: unknown; content?: { text?: string }[] }> }
    >;
    const extra = {} as unknown;
    const vehicle = await tools.render_vehicle_card.callback(
      { vin: "WBAFR7C57CC811956", year: "2012", make: "BMW", model: "550i" },
      extra,
    );
    assert.equal(
      (vehicle.structuredContent as { vin?: string }).vin,
      "WBAFR7C57CC811956",
    );
    assert.match(vehicle.content?.[0]?.text ?? "", /vehicle card/i);
  });

  it("serves ui:// HTML resources with the MCP Apps MIME type", () => {
    const resources = getRegisteredResources(createServer());
    for (const uri of Object.values(UI_URIS)) {
      const resource = resources[uri];
      assert.ok(resource, `expected resource ${uri}`);
      assert.equal(resource.metadata?.mimeType, RESOURCE_MIME_TYPE);
    }
  });
});
