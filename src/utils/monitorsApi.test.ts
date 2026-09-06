import assert from "node:assert/strict";
import { mock, test } from "node:test";
import {
  handleCreateMonitor,
  handleDeleteMonitor,
  handleGetMonitor,
  handleImportMonitorVehicles,
  handleListMonitorAlerts,
  handleListMonitors,
  handleRunMonitor,
  handleUpdateMonitor,
} from "../tools/monitors.ts";
import { CARSXE_API_BASE, type CarsxeFetch } from "./carsxeApi.ts";
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
      for (const [key, value] of Object.entries(rawHeaders as Record<string, string>)) {
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

function parsedUrl(url: string): URL {
  return new URL(url);
}

const API_KEY = "test-key-1234";
const getApiKey = () => API_KEY;

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

test("list_monitors sends GET /v1/monitors with key, source, and X-API-Key", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({
      success: true,
      monitors: [
        {
          id: "mon_1",
          name: "Fleet",
          vehicleType: "vin",
          products: ["recalls"],
          paused: false,
        },
      ],
    }),
  );

  const result = await handleListMonitors(getApiKey, { limit: 10 }, fetchFn);
  assert.equal(calls.length, 1);
  const url = parsedUrl(calls[0].url);
  assert.equal(url.origin, CARSXE_API_BASE);
  assert.equal(url.pathname, `/${monitorCollectionPath()}`);
  assert.equal(url.searchParams.get("key"), API_KEY);
  assert.equal(url.searchParams.get("source"), "mcp");
  assert.equal(url.searchParams.get("limit"), "10");
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers["X-API-Key"], API_KEY);
  assert.match(result.content[0].text, /Fleet/);
  assert.match(result.content[0].text, /https:\/\/docs\.carsxe\.com\//);
});

test("get_monitor sends GET /v1/monitors/:id", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({
      success: true,
      monitor: { id: "mon_1", name: "Fleet", vehicles: ["1C4JJXR64PW696340"] },
    }),
  );

  await handleGetMonitor(getApiKey, { id: "mon_1" }, fetchFn);
  assert.equal(calls[0].method, "GET");
  assert.equal(parsedUrl(calls[0].url).pathname, `/${monitorItemPath("mon_1")}`);
});

test("create_monitor sends POST /v1/monitors with the example JSON body", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({
      success: true,
      monitor: { id: "mon_new", name: "Fleet" },
    }),
  );

  await handleCreateMonitor(
    getApiKey,
    {
      name: "Fleet",
      vehicleType: "vin",
      vehicles: ["1C4JJXR64PW696340"],
      products: ["recalls"],
      schedule: { frequency: "daily" },
      delivery: ["email"],
    },
    fetchFn,
  );

  assert.equal(calls[0].method, "POST");
  assert.equal(parsedUrl(calls[0].url).pathname, "/v1/monitors");
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

test("update_monitor sends PATCH /v1/monitors/:id including paused", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({
      success: true,
      monitor: { id: "mon_1", name: "Fleet", paused: true },
    }),
  );

  await handleUpdateMonitor(getApiKey, { id: "mon_1", paused: true }, fetchFn);
  assert.equal(calls[0].method, "PATCH");
  assert.equal(parsedUrl(calls[0].url).pathname, "/v1/monitors/mon_1");
  assert.deepEqual(calls[0].body, { paused: true });
});

test("update_monitor refuses an empty patch before calling the API", async () => {
  const fetchFn = mock.fn<CarsxeFetch>(async () => {
    throw new Error("fetch should not be called");
  });

  const result = await handleUpdateMonitor(getApiKey, { id: "mon_1" }, fetchFn);
  assert.equal(fetchFn.mock.callCount(), 0);
  assert.match(result.content[0].text, /at least one field/i);
});

test("delete_monitor sends DELETE /v1/monitors/:id", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({ success: true }),
  );

  const result = await handleDeleteMonitor(getApiKey, { id: "mon_1" }, fetchFn);
  assert.equal(calls[0].method, "DELETE");
  assert.equal(parsedUrl(calls[0].url).pathname, "/v1/monitors/mon_1");
  assert.match(result.content[0].text, /deleted/);
});

test("import_monitor_vehicles sends POST /v1/monitors/:id/import", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({ success: true, imported: 2 }),
  );

  await handleImportMonitorVehicles(
    getApiKey,
    { id: "mon_1", vehicles: ["VIN1", "VIN2"] },
    fetchFn,
  );
  assert.equal(calls[0].method, "POST");
  assert.equal(parsedUrl(calls[0].url).pathname, `/${monitorImportPath("mon_1")}`);
  assert.deepEqual(calls[0].body, { vehicles: ["VIN1", "VIN2"] });
});

test("run_monitor sends POST /v1/monitors/:id/run", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({ success: true, runId: "run_1", status: "queued" }),
  );

  const result = await handleRunMonitor(getApiKey, { id: "mon_1" }, fetchFn);
  assert.equal(calls[0].method, "POST");
  assert.equal(parsedUrl(calls[0].url).pathname, `/${monitorRunPath("mon_1")}`);
  assert.deepEqual(calls[0].body, {});
  assert.match(result.content[0].text, /run_1/);
});

test("list_monitor_alerts uses account or per-monitor paths", async () => {
  const { fetchFn, calls } = captureFetch(() =>
    jsonResponse({ success: true, alerts: [] }),
  );

  await handleListMonitorAlerts(getApiKey, { limit: 5 }, fetchFn);
  await handleListMonitorAlerts(getApiKey, { id: "mon_1" }, fetchFn);

  assert.equal(parsedUrl(calls[0].url).pathname, `/${monitorAlertsPath()}`);
  assert.equal(parsedUrl(calls[0].url).searchParams.get("limit"), "5");
  assert.equal(parsedUrl(calls[1].url).pathname, `/${monitorAlertsPath("mon_1")}`);
});

test("monitor tools require an API key and do not fetch without one", async () => {
  const fetchFn = mock.fn<CarsxeFetch>(async () => {
    throw new Error("fetch should not be called");
  });

  const result = await handleListMonitors(() => null, {}, fetchFn);
  assert.equal(fetchFn.mock.callCount(), 0);
  assert.match(result.content[0].text, /API key not provided/);
});

test("404 feature-gate / missing monitor is formatted as Markdown", async () => {
  const { fetchFn } = captureFetch(() =>
    jsonResponse({ success: false, message: "Not found" }, 404),
  );

  const result = await handleGetMonitor(getApiKey, { id: "missing" }, fetchFn);
  assert.match(result.content[0].text, /❌/);
  assert.match(result.content[0].text, /Not found/);
  assert.match(result.content[0].text, /https:\/\/docs\.carsxe\.com\//);
  assert.doesNotMatch(result.content[0].text, /ConfigCat|GCP|oauth/i);
});
