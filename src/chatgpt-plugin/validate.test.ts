import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DEMO_RECORDING_PLACEHOLDER } from "./constants.js";
import { buildChatgptPlugin, listPackageFiles, repoRoot, stagePackage } from "./build.js";
import { getRegisteredTools, registerAllTools } from "../registerTools.js";
import { loadSanitizedSkills, skillAsksForApiKey } from "./skills.js";
import { validatePackage, validateZip } from "./validate.js";
import { createZip, readZip } from "./zip.js";

function withStaged(mutate: (dir: string) => void): string {
  const dir = mkdtempSync(join(tmpdir(), "carsxe-chatgpt-case-"));
  stagePackage(dir);
  mutate(dir);
  return dir;
}

function assertForbidden(mutate: (dir: string) => void, code: string): void {
  const dir = withStaged(mutate);
  try {
    const report = validatePackage(dir);
    assert.ok(
      report.errors.some((error) => error.includes(code)),
      `expected ${code} in\n${report.errors.join("\n")}`,
    );
    const zipped = validateZip(createZip(listPackageFiles(dir)));
    assert.ok(
      zipped.errors.some((error) => error.includes(code)),
      `expected ${code} in zip\n${zipped.errors.join("\n")}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("ChatGPT plugin package", () => {
  it("sanitizes skills so none ask the user for an API key", () => {
    const raw = readFileSync(join(repoRoot(), "skills/vehicle-specs/SKILL.md"), "utf8");
    assert.ok(skillAsksForApiKey(raw));
    for (const skill of loadSanitizedSkills(join(repoRoot(), "skills"))) {
      assert.equal(skillAsksForApiKey(skill.markdown), null, skill.name);
    }
  });

  it("builds a ZIP that passes the documented package rules", () => {
    const zipPath = join(tmpdir(), `carsxe-chatgpt-plugin-test-${Date.now()}.zip`);
    try {
      const result = buildChatgptPlugin(zipPath);
      assert.ok(result.warnings.some((warning) => warning.includes("TODO")));
      const buffer = readFileSync(zipPath);
      const report = validateZip(buffer);
      assert.deepEqual(report.errors, []);
      const zipTest = spawnSync("python3", ["-m", "zipfile", "-t", zipPath], { encoding: "utf8" });
      assert.equal(zipTest.status, 0, zipTest.stderr);
      const entries = readZip(buffer);
      const paths = entries.map((entry) => entry.path);
      assert.ok(paths.includes("plugin.json"));
      assert.ok(paths.includes("mcp.json"));
      assert.ok(paths.includes("assets/logo.png"));
      assert.equal(paths.some((path) => path.includes("hooks") || path.endsWith(".app.json")), false);
      const mcp = JSON.parse(
        entries.find((entry) => entry.path === "mcp.json")?.data.toString("utf8") ?? "{}",
      ) as { mcpServers: { carsxe: { headers?: unknown; extensions: unknown } } };
      assert.equal(mcp.mcpServers.carsxe.headers, undefined);
      assert.equal(buffer.includes(Buffer.from("X-API-Key")), false);
      assert.equal(buffer.includes(Buffer.from("clientSecret")), false);
      assert.equal(buffer.includes(Buffer.from("test_credentials")), false);
      const plugin = JSON.parse(
        entries.find((entry) => entry.path === "plugin.json")?.data.toString("utf8") ?? "{}",
      ) as {
        version: string;
        extensions: { "com.openai": { review: { demo_recording_url: string } } };
      };
      assert.equal(plugin.version, "1.3.0");
      assert.equal(plugin.extensions["com.openai"].review.demo_recording_url, DEMO_RECORDING_PLACEHOLDER);
      const rootMcp = readFileSync(join(repoRoot(), "mcp.json"), "utf8");
      assert.match(rootMcp, /X-API-Key/);
    } finally {
      rmSync(zipPath, { force: true });
    }
  });

  it("keeps positive test cases on registered tools", () => {
    const dir = withStaged(() => {});
    try {
      const plugin = JSON.parse(readFileSync(join(dir, "plugin.json"), "utf8")) as {
        extensions: {
          "com.openai": {
            review: { test_cases: { positive: { tools_triggered: string }[] } };
          };
        };
      };
      const server = new McpServer({ name: "carsxe-test", version: "1.3.0" });
      registerAllTools(server, () => null);
      const tools = new Set(Object.keys(getRegisteredTools(server)));
      const cases = plugin.extensions["com.openai"].review.test_cases.positive;
      assert.equal(cases.length, 5);
      for (const testCase of cases) {
        for (const name of testCase.tools_triggered.split(",").map((part) => part.trim())) {
          assert.ok(tools.has(name), name);
        }
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails when forbidden content is added", () => {
    assertForbidden((dir) => {
      const mcpPath = join(dir, "mcp.json");
      const mcp = JSON.parse(readFileSync(mcpPath, "utf8")) as {
        mcpServers: { carsxe: { headers?: Record<string, string> } };
      };
      mcp.mcpServers.carsxe.headers = { "X-API-Key": "$" + "{CARSXE_API_KEY}" };
      writeFileSync(mcpPath, JSON.stringify(mcp));
    }, "mcp_headers_forbidden");

    assertForbidden((dir) => {
      writeFileSync(join(dir, ".app.json"), '{"apps":{}}\n');
    }, "app_configuration_excluded");

    assertForbidden((dir) => {
      mkdirSync(join(dir, "hooks"));
      writeFileSync(join(dir, "hooks", "hooks.json"), "{}\n");
    }, "hooks_forbidden");

    assertForbidden((dir) => {
      const pluginPath = join(dir, "plugin.json");
      const plugin = JSON.parse(readFileSync(pluginPath, "utf8")) as {
        extensions: { "com.openai": { apps?: string } };
      };
      plugin.extensions["com.openai"].apps = "./.app.json";
      writeFileSync(pluginPath, JSON.stringify(plugin));
    }, "app_configuration_excluded");

    assertForbidden((dir) => {
      const mcpPath = join(dir, "mcp.json");
      const mcp = JSON.parse(readFileSync(mcpPath, "utf8")) as {
        mcpServers: {
          carsxe: { extensions: { "com.openai": { auth: { clientSecret?: string } } } };
        };
      };
      mcp.mcpServers.carsxe.extensions["com.openai"].auth.clientSecret = "super-secret";
      writeFileSync(mcpPath, JSON.stringify(mcp));
    }, "secrets_forbidden");

    assertForbidden((dir) => {
      writeFileSync(
        join(dir, "skills", "vehicle-specs", "SKILL.md"),
        "---\nname: vehicle-specs\ndescription: Specs.\n---\n\nAsk the user for an API key.\n",
      );
    }, "skill_requests_api_key");

    assertForbidden((dir) => {
      const pluginPath = join(dir, "plugin.json");
      const plugin = JSON.parse(readFileSync(pluginPath, "utf8")) as {
        extensions: { "com.openai": { review: { test_credentials?: { password: string } } } };
      };
      plugin.extensions["com.openai"].review.test_credentials = { password: "hunter2" };
      writeFileSync(pluginPath, JSON.stringify(plugin));
    }, "reviewer_credentials_forbidden");
  });
});
