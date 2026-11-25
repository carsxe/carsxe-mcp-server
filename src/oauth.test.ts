import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAccessToken } from "./oauth.js";

process.env.MCP_OAUTH_INTERNAL_SECRET = "test-internal-secret";

const RESOURCE = "https://mcp.carsxe.com/mcp";

async function withIntrospection<T>(
  body: unknown,
  run: (calls: string[]) => Promise<T>,
): Promise<T> {
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return Response.json(body);
  }) as typeof fetch;
  try {
    return await run(calls);
  } finally {
    globalThis.fetch = original;
  }
}

describe("resolveAccessToken audience", { concurrency: false }, () => {
  it("accepts a matching aud", async () => {
    await withIntrospection(
      { active: true, api_key: "key_match", aud: RESOURCE },
      async () => {
        assert.deepEqual(await resolveAccessToken("mcp_at_match"), {
          apiKey: "key_match",
          audience: RESOURCE,
        });
      },
    );
  });

  it("accepts a matching aud with a trailing slash", async () => {
    await withIntrospection(
      { active: true, api_key: "key_slash", aud: `${RESOURCE}/` },
      async () => {
        assert.deepEqual(await resolveAccessToken("mcp_at_slash"), {
          apiKey: "key_slash",
          audience: `${RESOURCE}/`,
        });
      },
    );
  });

  it("accepts a token with no aud", async () => {
    await withIntrospection({ active: true, api_key: "key_missing" }, async () => {
      assert.deepEqual(await resolveAccessToken("mcp_at_missing"), {
        apiKey: "key_missing",
        audience: null,
      });
    });
  });

  it("accepts an aud array that contains the resource", async () => {
    await withIntrospection(
      {
        active: true,
        api_key: "key_array",
        aud: ["https://example.com/other", RESOURCE],
      },
      async () => {
        assert.deepEqual(await resolveAccessToken("mcp_at_array"), {
          apiKey: "key_array",
          audience: RESOURCE,
        });
      },
    );
  });

  it("rejects a wrong aud and caches the rejection", async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map(String).join(" "));
    };
    try {
      await withIntrospection(
        { active: true, api_key: "key_wrong", aud: "https://example.com/mcp" },
        async (calls) => {
          const token = "mcp_at_wrong";
          assert.equal(await resolveAccessToken(token), null);
          assert.equal(await resolveAccessToken(token), null);
          assert.equal(calls.length, 1);
          assert.match(calls[0], /\/api\/auth\/mcp\/introspect$/);
          assert.equal(warnings.length, 1);
          assert.match(warnings[0], /aud/);
          assert.equal(warnings[0].includes(token), false);
        },
      );
    } finally {
      console.warn = originalWarn;
    }
  });
});
