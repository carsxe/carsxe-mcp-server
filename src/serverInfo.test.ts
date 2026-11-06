import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  MCP_SERVER_INSTRUCTIONS,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
} from "./serverInfo.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("MCP server version and instructions", () => {
  it("aligns package, plugin, and registry metadata at 1.2.0", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      version: string;
    };
    const plugin = JSON.parse(readFileSync(join(root, "plugin.json"), "utf8")) as {
      version: string;
      author?: { email?: string };
    };
    const serverJson = JSON.parse(
      readFileSync(join(root, "server.json"), "utf8"),
    ) as { version: string; name: string };
    const cursorPlugin = JSON.parse(
      readFileSync(join(root, ".cursor-plugin/plugin.json"), "utf8"),
    ) as { version: string; author?: { email?: string } };

    assert.equal(MCP_SERVER_VERSION, "1.2.0");
    assert.equal(pkg.version, MCP_SERVER_VERSION);
    assert.equal(plugin.version, MCP_SERVER_VERSION);
    assert.equal(cursorPlugin.version, MCP_SERVER_VERSION);
    assert.equal(serverJson.version, MCP_SERVER_VERSION);
    assert.equal(MCP_SERVER_NAME, "carsxe");
    assert.equal(serverJson.name, "io.github.carsxe/carsxe-mcp");
    assert.equal(plugin.author?.email, "abraham@carsxe.com");
    assert.equal(cursorPlugin.author?.email, "abraham@carsxe.com");
  });

  it("advertises the directory-safe instructions string", () => {
    assert.equal(
      MCP_SERVER_INSTRUCTIONS,
      "CarsXE provides vehicle data. Use it when the user gives a VIN (17 characters), a license plate with state or country, a year/make/model, an OBD-II trouble code, or a photo of a VIN plate or license plate, and wants specs, recalls, market value, history, images, lien/theft status, or a code explanation. Send only the identifiers needed for the lookup.",
    );
  });
});
