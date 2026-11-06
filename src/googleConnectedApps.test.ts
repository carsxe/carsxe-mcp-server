import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import {
  GOOGLE_CONNECTED_APPS_PATH,
  handleGoogleConnectedApps,
  resolveGoogleConnectedAppsVerification,
} from "./googleConnectedApps.js";

const VERIFICATION_JSON = '{"google-site-verification":"abc123"}';

function listen(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
): Promise<{ server: http.Server; origin: string }> {
  const server = http.createServer(handler);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

describe("Google Connected Apps verification", () => {
  it("returns 404 JSON when the env var is unset or blank", () => {
    for (const value of [undefined, "", "   "]) {
      const result = resolveGoogleConnectedAppsVerification(value);
      assert.equal(result.status, 404);
      assert.deepEqual(JSON.parse(result.body), {
        error: "not_found",
        error_description: "Google Connected Apps verification is not configured",
      });
    }
  });

  it("returns the exact env var body when it is valid JSON", () => {
    const result = resolveGoogleConnectedAppsVerification(VERIFICATION_JSON);
    assert.equal(result.status, 200);
    assert.equal(result.body, VERIFICATION_JSON);
  });

  it("rejects invalid JSON instead of serving it", () => {
    const result = resolveGoogleConnectedAppsVerification("not-json");
    assert.equal(result.status, 500);
    assert.equal(JSON.parse(result.body).error, "server_error");
  });
});

describe("GET/HEAD /.well-known/google-connected-apps", { concurrency: false }, () => {
  let server: http.Server;
  let origin: string;
  let envValue: string | undefined;

  before(async () => {
    const started = await listen((req, res) => {
      const url = new URL(req.url ?? "/", origin);
      handleGoogleConnectedApps(req, res, url, envValue);
    });
    server = started.server;
    origin = started.origin;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("returns 404 JSON with no redirect when unset", async () => {
    envValue = undefined;
    const res = await fetch(`${origin}${GOOGLE_CONNECTED_APPS_PATH}`, {
      redirect: "manual",
    });
    assert.equal(res.status, 404);
    assert.equal(res.headers.get("location"), null);
    assert.match(
      res.headers.get("content-type") ?? "",
      /^application\/json; charset=utf-8$/i,
    );
    assert.equal(JSON.parse(await res.text()).error, "not_found");
  });

  it("returns 200 JSON with no redirect when set", async () => {
    envValue = VERIFICATION_JSON;
    const res = await fetch(`${origin}${GOOGLE_CONNECTED_APPS_PATH}`, {
      redirect: "manual",
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("location"), null);
    assert.match(
      res.headers.get("content-type") ?? "",
      /^application\/json; charset=utf-8$/i,
    );
    assert.equal(await res.text(), VERIFICATION_JSON);
  });

  it("supports HEAD with the same status and no body", async () => {
    envValue = VERIFICATION_JSON;
    const res = await fetch(`${origin}${GOOGLE_CONNECTED_APPS_PATH}`, {
      method: "HEAD",
      redirect: "manual",
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("location"), null);
    assert.match(
      res.headers.get("content-type") ?? "",
      /^application\/json; charset=utf-8$/i,
    );
    assert.equal(await res.text(), "");
  });
});
