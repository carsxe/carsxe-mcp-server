import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { createCarsxeHttpServer } from "./httpHandler.js";
import { GOOGLE_CONNECTED_APPS_PATH } from "./googleConnectedApps.js";

const INITIALIZE_BODY = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "0.0.0" },
  },
});

describe("hosted HTTP MCP server", { concurrency: false }, () => {
  let server: ReturnType<typeof createCarsxeHttpServer>;
  let origin: string;
  const previousVerification = process.env.GOOGLE_CONNECTED_APPS_VERIFICATION;

  before(async () => {
    server = createCarsxeHttpServer();
    origin = await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const { port } = server.address() as AddressInfo;
        resolve(`http://127.0.0.1:${port}`);
      });
    });
  });

  after(async () => {
    if (previousVerification === undefined) {
      delete process.env.GOOGLE_CONNECTED_APPS_VERIFICATION;
    } else {
      process.env.GOOGLE_CONNECTED_APPS_VERIFICATION = previousVerification;
    }
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("returns 401 + WWW-Authenticate on unauthenticated POST /mcp initialize", async () => {
    const res = await fetch(`${origin}/mcp`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      body: INITIALIZE_BODY,
      redirect: "manual",
    });
    assert.equal(res.status, 401, "OAuth clients depend on this 401 challenge");
    const challenge = res.headers.get("www-authenticate") ?? "";
    assert.match(challenge, /^Bearer /);
    assert.match(challenge, /resource_metadata=/);
    assert.equal(JSON.parse(await res.text()).error, "unauthorized");
  });

  it("does not allow unauthenticated tools/list on POST /mcp", async () => {
    const res = await fetch(`${origin}/mcp`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
      redirect: "manual",
    });
    assert.equal(res.status, 401);
    assert.match(res.headers.get("www-authenticate") ?? "", /resource_metadata=/);
  });

  it("serves Google Connected Apps 404 when the env var is unset", async () => {
    delete process.env.GOOGLE_CONNECTED_APPS_VERIFICATION;
    const res = await fetch(`${origin}${GOOGLE_CONNECTED_APPS_PATH}`, {
      redirect: "manual",
    });
    assert.equal(res.status, 404);
    assert.equal(res.headers.get("location"), null);
    assert.match(
      res.headers.get("content-type") ?? "",
      /^application\/json; charset=utf-8$/i,
    );
  });

  it("serves Google Connected Apps 200 JSON when the env var is set", async () => {
    const body = '{"google-site-verification":"live-test"}';
    process.env.GOOGLE_CONNECTED_APPS_VERIFICATION = body;
    const res = await fetch(`${origin}${GOOGLE_CONNECTED_APPS_PATH}`, {
      redirect: "manual",
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("location"), null);
    assert.match(
      res.headers.get("content-type") ?? "",
      /^application\/json; charset=utf-8$/i,
    );
    assert.equal(await res.text(), body);
  });
});
