import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CHATGPT_EXCLUDED_OWNERSHIP_TOOLS,
  CHATGPT_OAUTH_AUDIENCE,
  classifyIncomingCredential,
  isChatgptOauthSurface,
} from "../chatgptSurface.js";
import { readIntrospectionBody } from "../oauth.js";
import { getRegisteredTools, registerAllTools } from "../registerTools.js";

const OWNERSHIP = [...CHATGPT_EXCLUDED_OWNERSHIP_TOOLS];

type Handler = (request: { method: string; params?: unknown }, extra: unknown) => Promise<unknown>;

function handlers(server: McpServer): Map<string, Handler> {
  return (
    server as unknown as { server: { _requestHandlers: Map<string, Handler> } }
  ).server._requestHandlers;
}

function createServer(chatgptSurface: boolean) {
  const server = new McpServer({ name: "carsxe-test", version: "1.3.0" });
  registerAllTools(server, () => null, { chatgptSurface });
  return server;
}

describe("ChatGPT OAuth surface", () => {
  it("treats OpenAI's MCP user agent on an OAuth token as ChatGPT", () => {
    assert.equal(
      isChatgptOauthSurface({
        oauthAccessToken: true,
        userAgent: "openai-mcp/1.0.0",
        audience: null,
      }),
      true,
    );
    assert.equal(
      isChatgptOauthSurface({
        oauthAccessToken: true,
        userAgent: "openai-mcp/1.0.0 (Codex)",
        audience: null,
      }),
      true,
    );
  });

  it("treats an OAuth token whose audience is the MCP resource as ChatGPT", () => {
    assert.equal(
      isChatgptOauthSurface({
        oauthAccessToken: true,
        userAgent: "python-httpx/0.27.0",
        audience: CHATGPT_OAUTH_AUDIENCE,
      }),
      true,
    );
    assert.equal(
      isChatgptOauthSurface({
        oauthAccessToken: true,
        userAgent: null,
        audience: `${CHATGPT_OAUTH_AUDIENCE}/`,
      }),
      true,
    );
  });

  it("keeps Claude OAuth and API-key callers off the ChatGPT surface", () => {
    assert.equal(
      isChatgptOauthSurface({
        oauthAccessToken: true,
        userAgent: "claude-user",
        audience: null,
      }),
      false,
    );
    assert.equal(
      isChatgptOauthSurface({
        oauthAccessToken: false,
        userAgent: "openai-mcp/1.0.0",
        audience: CHATGPT_OAUTH_AUDIENCE,
      }),
      false,
    );
    assert.equal(
      classifyIncomingCredential({
        xApiKey: "carsxe_test_key",
        authorization: "Bearer mcp_at_abc",
        userAgent: "openai-mcp/1.0.0",
      }).kind,
      "api-key",
    );
    assert.equal(
      classifyIncomingCredential({
        authorization: "Bearer mcp_at_abc",
        userAgent: "openai-mcp/1.0.0",
      }).kind,
      "oauth",
    );
    assert.equal(
      classifyIncomingCredential({
        authorization: "Bearer plain-api-key",
        userAgent: "Claude-Desktop",
      }).kind,
      "api-key",
    );
    assert.equal(
      classifyIncomingCredential({ queryKey: "plain-api-key" }).kind,
      "api-key",
    );
  });

  it("reads aud from introspection and tolerates responses that omit it", () => {
    assert.deepEqual(
      readIntrospectionBody({
        active: true,
        api_key: "key_1",
        aud: CHATGPT_OAUTH_AUDIENCE,
      }),
      { apiKey: "key_1", audience: CHATGPT_OAUTH_AUDIENCE },
    );
    assert.deepEqual(readIntrospectionBody({ active: true, api_key: "key_1" }), {
      apiKey: "key_1",
      audience: null,
    });
    assert.deepEqual(readIntrospectionBody({ active: false }), {
      apiKey: null,
      audience: null,
    });
  });

  it("omits ownership tools from the ChatGPT tool list and refuses calls", async () => {
    const server = createServer(true);
    const listed = await handlers(server).get("tools/list")?.(
      { method: "tools/list" },
      {},
    );
    const names = (
      listed as { tools: { name: string }[] }
    ).tools.map((tool) => tool.name);
    for (const name of OWNERSHIP) {
      assert.equal(names.includes(name), false, name);
      assert.equal(getRegisteredTools(server)[name], undefined);
      await assert.rejects(
        async () => {
          await handlers(server).get("tools/call")?.({
            method: "tools/call",
            params: { name, arguments: { vin: "1".repeat(17) } },
          }, {});
        },
        /not found/,
      );
    }
    assert.ok(names.includes("get_vehicle_specs"));
  });

  it("keeps ownership tools for API-key and Claude registration", async () => {
    const server = createServer(false);
    const listed = await handlers(server).get("tools/list")?.(
      { method: "tools/list" },
      {},
    );
    const names = new Set(
      (listed as { tools: { name: string }[] }).tools.map((tool) => tool.name),
    );
    for (const name of OWNERSHIP) assert.ok(names.has(name), name);
    const result = (await handlers(server).get("tools/call")?.(
      {
        method: "tools/call",
        params: {
          name: "get_ownership_by_vin",
          arguments: { vin: "1HGBH41JXMN109186" },
        },
      },
      {},
    )) as { content?: { text?: string }[]; isError?: boolean };
    assert.equal(result.isError, undefined);
    assert.match(result.content?.[0]?.text ?? "", /API key/);
  });
});
