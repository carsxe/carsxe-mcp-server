import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { getRegisteredTools, registerAllTools } from "../registerTools.js";
import { createCarsxeMcpServer } from "../serverInfo.js";

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

const EXPECTED_DESCRIPTIONS: Record<string, string> = {
  get_vehicle_specs:
    "Get comprehensive vehicle specifications by VIN. Returns Markdown plus structuredContent (vin, year, make, model, and key specs).",
  get_market_value:
    "Get the estimated market value for a vehicle by VIN. Returns Markdown plus structuredContent with retail and trade-in bands.",
  get_vehicle_recalls:
    "Get vehicle recall information by VIN. Returns Markdown plus structuredContent (hasRecalls, recallCount, recalls[]).",
  render_vehicle_card:
    "Display a visual vehicle identity card from a VIN and key spec fields (year, make, model, trim, engine). Use when the user wants to see a card.",
  render_market_value:
    "Display a visual market-value card from retail and trade-in value bands for a VIN.",
  render_recalls:
    "Display a visual open-recalls card from a VIN, recall count, and recall list.",
  submit_recalls_batch:
    "Creates a batch job on your CarsXE account; optionally calls your webhookUrl when complete.",
};

const STEERING_PATTERN =
  /always call|call \w+ first|after fetching|do not remount|do not expect UI|do not attach UI|poll get_/i;

function createServer() {
  const server = createCarsxeMcpServer();
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
      assertExplicitBoolean(annotations.idempotentHint, `${name}.idempotentHint`);

      assert.equal(
        annotations.readOnlyHint,
        !READ_ONLY_FALSE.has(name),
        `${name}.readOnlyHint`,
      );
      assert.equal(
        annotations.idempotentHint,
        !READ_ONLY_FALSE.has(name),
        `${name}.idempotentHint`,
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
      assert.deepEqual(
        submitted,
        {
          readOnlyHint: registered?.readOnlyHint,
          openWorldHint: registered?.openWorldHint,
          destructiveHint: registered?.destructiveHint,
        },
        `${name} submission annotations`,
      );
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

  it("uses policy-safe descriptions without cross-tool steering", () => {
    const tools = getRegisteredTools(createServer());
    for (const name of EXPECTED_TOOLS) {
      const description = tools[name]?.description ?? "";
      assert.ok(description.length > 0, `${name} must have a description`);
      assert.equal(
        STEERING_PATTERN.test(description),
        false,
        `${name} description must not steer across tools: ${description}`,
      );
      if (name in EXPECTED_DESCRIPTIONS) {
        assert.equal(description, EXPECTED_DESCRIPTIONS[name], name);
      }
    }
  });
});
