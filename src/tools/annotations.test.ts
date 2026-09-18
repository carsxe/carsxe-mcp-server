import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRegisteredTools, registerAllTools } from "../registerTools.js";

const OPEN_WORLD_FALSE = new Set([
  "render_vehicle_card",
  "render_market_value",
  "render_recalls",
]);

const READ_ONLY_FALSE = new Set(["submit_recalls_batch"]);

const EXPECTED_TOOLS = [
  "get_vehicle_specs",
  "decode_license_plate",
  "decode_international_vin",
  "get_market_value",
  "get_vehicle_history",
  "get_vehicle_images",
  "get_vehicle_recalls",
  "extract_vin_from_image",
  "get_year_make_model",
  "decode_obd_code",
  "read_license_plate_from_image",
  "check_lien_and_theft",
  "get_recalls_by_ymm",
  "submit_recalls_batch",
  "get_recalls_batch_status",
  "get_recalls_batch_results",
  "download_recalls_batch",
  "get_ymm_options",
  "get_ownership_by_vin",
  "get_ownership_by_person",
  "get_ownership_by_address",
  "get_ownership_by_zip",
  "render_vehicle_card",
  "render_market_value",
  "render_recalls",
] as const;

function createServer() {
  const server = new McpServer({ name: "carsxe-test", version: "1.0.1" });
  registerAllTools(server, () => null);
  return server;
}

function assertExplicitBoolean(
  value: boolean | null | undefined,
  label: string,
): asserts value is boolean {
  assert.equal(typeof value, "boolean", `${label} must be an explicit boolean, got ${value}`);
}

describe("OpenAI tool annotation matrix", () => {
  it("registers 25 tools with explicit true/false hints matching the remediation matrix", () => {
    const tools = getRegisteredTools(createServer());
    const names = Object.keys(tools).sort();
    assert.deepEqual(names, [...EXPECTED_TOOLS].sort());
    assert.equal(names.length, 25);

    for (const name of EXPECTED_TOOLS) {
      const annotations = tools[name]?.annotations;
      assert.ok(annotations, `${name} must declare annotations`);
      assertExplicitBoolean(annotations.readOnlyHint, `${name}.readOnlyHint`);
      assertExplicitBoolean(annotations.openWorldHint, `${name}.openWorldHint`);
      assertExplicitBoolean(annotations.destructiveHint, `${name}.destructiveHint`);

      assert.equal(
        annotations.readOnlyHint,
        !READ_ONLY_FALSE.has(name),
        `${name}.readOnlyHint`,
      );
      assert.equal(
        annotations.openWorldHint,
        !OPEN_WORLD_FALSE.has(name),
        `${name}.openWorldHint`,
      );
      assert.equal(annotations.destructiveHint, false, `${name}.destructiveHint`);
    }
  });

  it("keeps chatgpt-app-submission.json annotations in sync with registered tools", () => {
    const tools = getRegisteredTools(createServer());
    const submissionPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../chatgpt-app-submission.json",
    );
    const submission = JSON.parse(readFileSync(submissionPath, "utf8")) as {
      tools: Record<
        string,
        {
          annotations: {
            readOnlyHint: boolean | null;
            openWorldHint: boolean | null;
            destructiveHint: boolean | null;
          };
          justifications: { open_world_justification?: string };
        }
      >;
    };

    const submissionNames = Object.keys(submission.tools).sort();
    assert.deepEqual(submissionNames, Object.keys(tools).sort());

    for (const name of EXPECTED_TOOLS) {
      const registered = tools[name]?.annotations;
      const submitted = submission.tools[name]?.annotations;
      assert.deepEqual(submitted, registered, `${name} submission annotations`);
      const justification =
        submission.tools[name]?.justifications.open_world_justification ?? "";
      assert.ok(
        justification.length > 0,
        `${name} must have an open_world_justification`,
      );
      if (OPEN_WORLD_FALSE.has(name)) {
        assert.match(justification, /does not call external APIs/i);
      } else {
        assert.match(
          justification,
          /internet-hosted|public internet|user-supplied/i,
        );
      }
    }
  });
});
