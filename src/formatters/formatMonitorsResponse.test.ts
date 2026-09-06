import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatMonitorAlerts,
  formatMonitorDetail,
  formatMonitorList,
} from "./formatMonitorsResponse.ts";

test("formatMonitorList renders Markdown for nested or top-level monitors", () => {
  const markdown = formatMonitorList({
    success: true,
    data: {
      monitors: [
        {
          id: "mon_1",
          name: "Fleet",
          vehicleType: "vin",
          vehicles: ["1C4JJXR64PW696340"],
          products: ["recalls"],
          schedule: { frequency: "daily" },
          delivery: ["email"],
          paused: false,
        },
      ],
    },
  });

  assert.match(markdown, /### 📡 Monitors \(1\)/);
  assert.match(markdown, /\*\*Fleet\*\*/);
  assert.match(markdown, /Active/);
  assert.match(markdown, /1C4JJXR64PW696340/);
  assert.match(markdown, /https:\/\/docs\.carsxe\.com\/docs/);
});

test("formatMonitorDetail lists vehicles and pause state", () => {
  const markdown = formatMonitorDetail({
    success: true,
    monitor: {
      id: "mon_1",
      name: "Fleet",
      paused: true,
      vehicles: ["VIN1", "VIN2"],
      products: ["recalls"],
    },
  });

  assert.match(markdown, /Monitor: Fleet/);
  assert.match(markdown, /Paused/);
  assert.match(markdown, /`VIN1`/);
  assert.match(markdown, /`VIN2`/);
});

test("formatMonitorAlerts handles empty and populated lists", () => {
  const empty = formatMonitorAlerts({ success: true, alerts: [] }, "mon_1");
  assert.match(empty, /Alerts for monitor `mon_1`/);
  assert.match(empty, /No alerts found/);

  const populated = formatMonitorAlerts({
    success: true,
    alerts: [
      {
        title: "New recall",
        vin: "1C4JJXR64PW696340",
        product: "recalls",
        createdAt: "2026-09-06T00:00:00Z",
        summary: "Airbag inflator",
      },
    ],
  });
  assert.match(populated, /New recall/);
  assert.match(populated, /1C4JJXR64PW696340/);
  assert.match(populated, /Airbag inflator/);
});
