import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CARSXE_API_BASE,
  carsxeApiJson,
  extractCarsxeErrorMessage,
  type CarsxeFetch,
} from "./carsxeApi.ts";
import { formatMonitorError } from "../formatters/formatMonitorsResponse.ts";
import {
  buildCreateMonitorBody,
  buildImportMonitorBody,
  buildUpdateMonitorBody,
  monitorAlertsPath,
  monitorCollectionPath,
  monitorImportPath,
  monitorItemPath,
  monitorRunPath,
} from "./monitorsApi.ts";

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function captureFetch(
  handler: (captured: CapturedRequest) => Response | Promise<Response>,
): { fetchFn: CarsxeFetch; calls: CapturedRequest[] } {
  const calls: CapturedRequest[] = [];
  const fetchFn: CarsxeFetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const headers: Record<string, string> = {};
    const rawHeaders = init?.headers;
    if (rawHeaders && typeof rawHeaders === "object" && !Array.isArray(rawHeaders)) {
      for (const [key, value] of Object.entries(
        rawHeaders as Record<string, string>,
      )) {
        headers[key] = value;
      }
    }
    const captured: CapturedRequest = {
      url,
      method: (init?.method ?? "GET").toUpperCase(),
      headers,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(captured);
    return handler(captured);
  };
  return { fetchFn, calls };
}

const API_KEY = "test-key-1234";

test("create monitor body matches the public API contract", () => {
  const body = buildCreateMonitorBody({
    name: "Fleet",
    vehicleType: "vin",
    vehicles: ["1C4JJXR64PW696340"],
    products: ["recalls"],
    schedule: { frequency: "daily" },
    delivery: ["email"],
  });

  assert.deepEqual(body, {
    name: "Fleet",
    vehicleType: "vin",
    vehicles: ["1C4JJXR64PW696340"],
    products: ["recalls"],
    schedule: { frequency: "daily" },
    delivery: ["email"],
  });
});

test("update monitor body includes paused for pause/resume and omits unset fields", () => {
  assert.deepEqual(buildUpdateMonitorBody({ paused: true }), { paused: true });
  assert.deepEqual(buildUpdateMonitorBody({ paused: false }), { paused: false });
  assert.equal(buildUpdateMonitorBody({}), undefined);
  assert.deepEqual(
    buildUpdateMonitorBody({
      name: "Fleet East",
      schedule: { frequency: "weekly", timezone: "America/New_York" },
    }),
    {
      name: "Fleet East",
      schedule: { frequency: "weekly", timezone: "America/New_York" },
    },
  );
});

test("import monitor body accepts vehicles and/or csv", () => {
  assert.deepEqual(buildImportMonitorBody({ vehicles: ["VIN1", "VIN2"] }), {
    vehicles: ["VIN1", "VIN2"],
  });
  assert.deepEqual(buildImportMonitorBody({ csv: "vin\nVIN1\n" }), {
    csv: "vin\nVIN1\n",
  });
  assert.equal(buildImportMonitorBody({}), undefined);
});

test("list monitors sends GET /v1/monitors with key, source, and X-API-Key", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({ success: true, monitors: [] }),
  );

  const result = await carsxeApiJson({
    apiKey: API_KEY,
    endpoint: monitorCollectionPath(),
    method: "GET",
    query: { limit: 10 },
    fetchFn,
  });

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  const url = new URL(calls[0].url);
  assert.equal(url.origin, CARSXE_API_BASE);
  assert.equal(url.pathname, "/v1/monitors");
  assert.equal(url.searchParams.get("key"), API_KEY);
  assert.equal(url.searchParams.get("source"), "mcp");
  assert.equal(url.searchParams.get("limit"), "10");
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers["X-API-Key"], API_KEY);
  assert.equal(calls[0].body, undefined);
});

test("get monitor sends GET /v1/monitors/:id", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({ success: true, monitor: { id: "mon_1" } }),
  );

  await carsxeApiJson({
    apiKey: API_KEY,
    endpoint: monitorItemPath("mon_1"),
    method: "GET",
    fetchFn,
  });

  assert.equal(calls[0].method, "GET");
  assert.equal(new URL(calls[0].url).pathname, "/v1/monitors/mon_1");
});

test("create monitor sends POST /v1/monitors with the example JSON body", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({ success: true, monitor: { id: "mon_new", name: "Fleet" } }),
  );

  await carsxeApiJson({
    apiKey: API_KEY,
    endpoint: monitorCollectionPath(),
    method: "POST",
    body: buildCreateMonitorBody({
      name: "Fleet",
      vehicleType: "vin",
      vehicles: ["1C4JJXR64PW696340"],
      products: ["recalls"],
      schedule: { frequency: "daily" },
      delivery: ["email"],
    }),
    fetchFn,
  });

  assert.equal(calls[0].method, "POST");
  assert.equal(new URL(calls[0].url).pathname, "/v1/monitors");
  assert.equal(calls[0].headers["Content-Type"], "application/json");
  assert.deepEqual(calls[0].body, {
    name: "Fleet",
    vehicleType: "vin",
    vehicles: ["1C4JJXR64PW696340"],
    products: ["recalls"],
    schedule: { frequency: "daily" },
    delivery: ["email"],
  });
});

test("update monitor sends PATCH /v1/monitors/:id including paused", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({ success: true, monitor: { id: "mon_1", paused: true } }),
  );

  await carsxeApiJson({
    apiKey: API_KEY,
    endpoint: monitorItemPath("mon_1"),
    method: "PATCH",
    body: buildUpdateMonitorBody({ paused: true }),
    fetchFn,
  });

  assert.equal(calls[0].method, "PATCH");
  assert.equal(new URL(calls[0].url).pathname, "/v1/monitors/mon_1");
  assert.deepEqual(calls[0].body, { paused: true });
});

test("delete monitor sends DELETE /v1/monitors/:id", async () => {
  const { fetchFn, calls } = captureFetch(() => jsonResponse({ success: true }));

  await carsxeApiJson({
    apiKey: API_KEY,
    endpoint: monitorItemPath("mon_1"),
    method: "DELETE",
    fetchFn,
  });

  assert.equal(calls[0].method, "DELETE");
  assert.equal(new URL(calls[0].url).pathname, "/v1/monitors/mon_1");
});

test("import vehicles sends POST /v1/monitors/:id/import", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({ success: true, imported: 2 }),
  );

  await carsxeApiJson({
    apiKey: API_KEY,
    endpoint: monitorImportPath("mon_1"),
    method: "POST",
    body: buildImportMonitorBody({ vehicles: ["VIN1", "VIN2"] }),
    fetchFn,
  });

  assert.equal(calls[0].method, "POST");
  assert.equal(new URL(calls[0].url).pathname, "/v1/monitors/mon_1/import");
  assert.deepEqual(calls[0].body, { vehicles: ["VIN1", "VIN2"] });
});

test("run now sends POST /v1/monitors/:id/run", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({ success: true, runId: "run_1" }),
  );

  await carsxeApiJson({
    apiKey: API_KEY,
    endpoint: monitorRunPath("mon_1"),
    method: "POST",
    body: {},
    fetchFn,
  });

  assert.equal(calls[0].method, "POST");
  assert.equal(new URL(calls[0].url).pathname, "/v1/monitors/mon_1/run");
  assert.deepEqual(calls[0].body, {});
});

test("alerts use account-wide or per-monitor paths", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({ success: true, alerts: [] }),
  );

  await carsxeApiJson({
    apiKey: API_KEY,
    endpoint: monitorAlertsPath(),
    method: "GET",
    query: { limit: 5 },
    fetchFn,
  });
  await carsxeApiJson({
    apiKey: API_KEY,
    endpoint: monitorAlertsPath("mon_1"),
    method: "GET",
    fetchFn,
  });

  assert.equal(new URL(calls[0].url).pathname, "/v1/monitors/alerts");
  assert.equal(new URL(calls[0].url).searchParams.get("limit"), "5");
  assert.equal(new URL(calls[1].url).pathname, "/v1/monitors/mon_1/alerts");
});

test("404 feature-gate message is Markdown-friendly and OSS-safe", async () => {
  const { fetchFn } = captureFetch(() =>
    jsonResponse({ success: false, message: "Not found" }, 404),
  );

  const result = await carsxeApiJson({
    apiKey: API_KEY,
    endpoint: "v1/monitors/missing",
    fetchFn,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 404);
    assert.equal(result.error, "Not found");
    const markdown = formatMonitorError(result.error);
    assert.match(markdown, /❌/);
    assert.match(markdown, /Not found/);
    assert.match(markdown, /https:\/\/docs\.carsxe\.com\//);
    assert.doesNotMatch(markdown, /ConfigCat|GCP|oauth/i);
  }
});

test("extractCarsxeErrorMessage uses a feature-gate fallback for empty 404 bodies", () => {
  const message = extractCarsxeErrorMessage(404, "");
  assert.match(message, /Monitoring may be disabled/);
});
