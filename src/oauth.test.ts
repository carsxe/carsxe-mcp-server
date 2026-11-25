import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import {
  handleOAuthRequest,
  OAUTH_UPSTREAM_PATHS,
  sendUnauthorized,
} from "./oauth.js";

function listen(
  handler: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) => void | Promise<void>,
): Promise<{ server: http.Server; origin: string }> {
  const server = http.createServer((req, res) => {
    void handler(req, res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

describe("OAuth proxy", { concurrency: false }, () => {
  const upstreamCalls: Array<{
    method: string;
    url: string;
    contentType: string | undefined;
    body: string;
  }> = [];

  let proxy: http.Server;
  let proxyOrigin: string;
  let upstream: http.Server;
  let upstreamOrigin: string;
  let previousWebBase: string | undefined;

  before(async () => {
    previousWebBase = process.env.OAUTH_WEB_BASE;
    const startedUpstream = await listen((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        upstreamCalls.push({
          method: req.method ?? "",
          url: req.url ?? "",
          contentType: Array.isArray(req.headers["content-type"])
            ? req.headers["content-type"][0]
            : req.headers["content-type"],
          body,
        });
        if (req.url === OAUTH_UPSTREAM_PATHS.register) {
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ client_id: "mcp_pub_test" }));
          return;
        }
        if (req.url === OAUTH_UPSTREAM_PATHS.token) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "invalid_grant" }));
          return;
        }
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "not_found" }));
      });
    });
    upstream = startedUpstream.server;
    upstreamOrigin = startedUpstream.origin;
    process.env.OAUTH_WEB_BASE = upstreamOrigin;

    const startedProxy = await listen(async (req, res) => {
      const url = new URL(req.url ?? "/", proxyOrigin);
      await handleOAuthRequest(req, res, url);
    });
    proxy = startedProxy.server;
    proxyOrigin = startedProxy.origin;
  });

  after(async () => {
    if (previousWebBase === undefined) {
      delete process.env.OAUTH_WEB_BASE;
    } else {
      process.env.OAUTH_WEB_BASE = previousWebBase;
    }
    await Promise.all(
      [proxy, upstream].map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
          }),
      ),
    );
  });

  it("proxies DCR to /api/auth/mcp/register", async () => {
    upstreamCalls.length = 0;
    const body = JSON.stringify({
      client_name: "Claude",
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    const res = await fetch(`${proxyOrigin}/oauth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    assert.equal(res.status, 201);
    assert.equal(upstreamCalls.length, 1);
    assert.equal(upstreamCalls[0]?.method, "POST");
    assert.equal(upstreamCalls[0]?.url, OAUTH_UPSTREAM_PATHS.register);
    assert.equal(upstreamCalls[0]?.contentType, "application/json");
    assert.equal(upstreamCalls[0]?.body, body);
    assert.equal((await res.json()).client_id, "mcp_pub_test");
  });

  it("forwards application/x-www-form-urlencoded token bodies and JSON errors intact", async () => {
    upstreamCalls.length = 0;
    const form =
      "grant_type=authorization_code&code=abc&code_verifier=xyz&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb";
    const res = await fetch(`${proxyOrigin}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    assert.equal(res.status, 400);
    assert.equal(upstreamCalls.length, 1);
    assert.equal(upstreamCalls[0]?.method, "POST");
    assert.equal(upstreamCalls[0]?.url, OAUTH_UPSTREAM_PATHS.token);
    assert.equal(
      upstreamCalls[0]?.contentType,
      "application/x-www-form-urlencoded",
    );
    assert.equal(upstreamCalls[0]?.body, form);
    assert.deepEqual(await res.json(), { error: "invalid_grant" });
  });

  it("redirects authorize to /mcp-auth with the query string", async () => {
    const res = await fetch(
      `${proxyOrigin}/oauth/authorize?client_id=abc&redirect_uri=https%3A%2F%2Fexample.com`,
      { redirect: "manual" },
    );
    assert.equal(res.status, 302);
    assert.equal(
      res.headers.get("location"),
      `${upstreamOrigin}/mcp-auth?client_id=abc&redirect_uri=https%3A%2F%2Fexample.com`,
    );
  });

  it("serves RFC 8414 and RFC 9728 metadata locally", async () => {
    const asMeta = await (
      await fetch(`${proxyOrigin}/.well-known/oauth-authorization-server`)
    ).json();
    assert.equal(asMeta.issuer, "https://mcp.carsxe.com");
    assert.equal(asMeta.token_endpoint, "https://mcp.carsxe.com/oauth/token");
    assert.equal(
      asMeta.registration_endpoint,
      "https://mcp.carsxe.com/oauth/register",
    );
    const rsMeta = await (
      await fetch(`${proxyOrigin}/.well-known/oauth-protected-resource`)
    ).json();
    assert.equal(rsMeta.resource, "https://mcp.carsxe.com/mcp");
    assert.deepEqual(rsMeta.authorization_servers, ["https://mcp.carsxe.com"]);
  });

  it("documents the production api.carsxe.com upstream endpoints", () => {
    assert.equal(
      `https://api.carsxe.com${OAUTH_UPSTREAM_PATHS.register}`,
      "https://api.carsxe.com/api/auth/mcp/register",
    );
    assert.equal(
      `https://api.carsxe.com${OAUTH_UPSTREAM_PATHS.token}`,
      "https://api.carsxe.com/api/auth/mcp/token",
    );
    assert.equal(
      `https://api.carsxe.com${OAUTH_UPSTREAM_PATHS.authorize}`,
      "https://api.carsxe.com/mcp-auth",
    );
  });

  it("emits a RFC 9728 WWW-Authenticate challenge on 401", async () => {
    const local = await listen((_req, res) => {
      sendUnauthorized(res, "Missing credentials");
    });
    try {
      const res = await fetch(local.origin);
      assert.equal(res.status, 401);
      const challenge = res.headers.get("www-authenticate") ?? "";
      assert.match(challenge, /^Bearer /);
      assert.match(
        challenge,
        /resource_metadata="https:\/\/mcp\.carsxe\.com\/\.well-known\/oauth-protected-resource"/,
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        local.server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
