import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LOGO_PNG, publicAsset } from "./publicAssets.js";
import { SERVER_ICON_URL, mcpServerInfo } from "./serverInfo.js";

describe("server icon", () => {
  it("advertises a same-origin PNG on initialize", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = new McpServer(mcpServerInfo());
    const client = new Client({ name: "harness", version: "1.0.0" });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const info = client.getServerVersion();
    assert.equal(info?.name, "carsxe");
    assert.equal(info?.icons?.[0]?.src, SERVER_ICON_URL);
    assert.equal(info?.icons?.[0]?.mimeType, "image/png");
    assert.deepEqual(info?.icons?.[0]?.sizes, ["256x256"]);
    await client.close();
    await server.close();
  });

  it("serves the square mark at /logo.png and /favicon.ico", () => {
    assert.equal(LOGO_PNG.subarray(0, 8).toString("binary"), "\x89PNG\r\n\x1a\n");
    assert.equal(LOGO_PNG.readUInt32BE(16), 256);
    assert.equal(LOGO_PNG.readUInt32BE(20), 256);
    assert.equal(LOGO_PNG.length, 16401);
    for (const path of ["/logo.png", "/favicon.ico"]) {
      const asset = publicAsset(path);
      assert.equal(asset?.contentType, "image/png");
      assert.equal(asset?.body.equals(LOGO_PNG), true);
    }
    assert.equal(publicAsset("/mcp"), null);
  });
});
