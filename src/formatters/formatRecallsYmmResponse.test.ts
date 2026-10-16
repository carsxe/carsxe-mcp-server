import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CarsXERecallsYmmResponse } from "../types/carsxe.js";
import { formatRecallsYmmResponse } from "./formatRecallsYmmResponse.js";

const ISO = "2024-10-16T12:34:56.000Z";
const DATE = "2024-10-16";
const MS = Date.parse(ISO);
const SEC = Math.floor(MS / 1000);

function ymmResponse(
  year: string,
  make: string,
  model: string,
  timestamp: unknown,
): CarsXERecallsYmmResponse {
  return {
    success: true,
    input: { year, make, model },
    data: {
      model_year: year,
      make,
      model,
      has_recalls: true,
      recall_count: 1,
      recalls: [
        {
          nhtsa_campaign_number: "24V-001",
          component: "Electrical System",
          summary: "Test recall",
        },
      ],
    },
    timestamp: timestamp as CarsXERecallsYmmResponse["timestamp"],
  };
}

const TIMESTAMP_SHAPES: Array<{ name: string; value: unknown; date?: string }> =
  [
    { name: "ISO string", value: ISO, date: DATE },
    { name: "date-only string", value: DATE, date: DATE },
    { name: "epoch milliseconds", value: MS, date: DATE },
    { name: "epoch seconds", value: SEC, date: DATE },
    { name: "numeric millisecond string", value: String(MS), date: DATE },
    { name: "numeric second string", value: String(SEC), date: DATE },
    { name: "Date instance", value: new Date(ISO), date: DATE },
    {
      name: "Firestore seconds object",
      value: { seconds: SEC, nanoseconds: 0 },
      date: DATE,
    },
    {
      name: "Firestore _seconds object",
      value: { _seconds: SEC, _nanoseconds: 0 },
      date: DATE,
    },
    { name: "Mongo $date object", value: { $date: ISO }, date: DATE },
    {
      name: "toISOString Date-like",
      value: { toISOString: () => ISO },
      date: DATE,
    },
    {
      name: "toDate Date-like",
      value: { toDate: () => new Date(ISO) },
      date: DATE,
    },
    { name: "missing undefined", value: undefined },
    { name: "missing null", value: null },
    { name: "missing empty string", value: "" },
    { name: "invalid string", value: "not-a-date" },
    { name: "empty object", value: {} },
  ];

describe("formatRecallsYmmResponse timestamps", () => {
  it("does not crash for 2024 Toyota Tundra when timestamp is a number", () => {
    const text = formatRecallsYmmResponse(
      ymmResponse("2024", "Toyota", "Tundra", MS),
    );
    assert.match(text, /2024/);
    assert.match(text, /Toyota/);
    assert.match(text, /Tundra/);
    assert.equal(text.includes(`**Report Generated:** ${DATE}`), true);
  });

  it("does not crash for 2019 Toyota Camry when timestamp is a Date-like object", () => {
    const text = formatRecallsYmmResponse(
      ymmResponse("2019", "Toyota", "Camry", {
        _seconds: SEC,
        _nanoseconds: 0,
      }),
    );
    assert.match(text, /2019/);
    assert.match(text, /Camry/);
    assert.equal(text.includes(`**Report Generated:** ${DATE}`), true);
  });

  for (const shape of TIMESTAMP_SHAPES) {
    it(`handles ${shape.name}`, () => {
      const text = formatRecallsYmmResponse(
        ymmResponse("2024", "Toyota", "Tundra", shape.value),
      );
      if (shape.date) {
        assert.equal(text.includes(`**Report Generated:** ${shape.date}`), true);
      } else {
        assert.equal(text.includes("Report Generated:"), false);
      }
    });
  }
});
