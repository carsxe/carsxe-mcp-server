import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatTimestampDate,
  parseTimestampToDate,
} from "./formatTimestamp.js";

const ISO = "2024-10-16T12:34:56.000Z";
const DATE = "2024-10-16";
const MS = Date.parse(ISO);
const SEC = Math.floor(MS / 1000);

describe("formatTimestampDate", () => {
  it("formats ISO strings as YYYY-MM-DD without calling split on non-strings", () => {
    assert.equal(formatTimestampDate(ISO), DATE);
    assert.equal(formatTimestampDate("2024-10-16T00:00:00-07:00"), DATE);
    assert.equal(formatTimestampDate("2024-10-16"), DATE);
    assert.equal(formatTimestampDate("  2024-10-16T12:34:56Z  "), DATE);
  });

  it("formats millisecond and second epoch numbers", () => {
    assert.equal(formatTimestampDate(MS), DATE);
    assert.equal(formatTimestampDate(SEC), DATE);
    assert.equal(formatTimestampDate(String(MS)), DATE);
    assert.equal(formatTimestampDate(String(SEC)), DATE);
  });

  it("formats Date instances", () => {
    assert.equal(formatTimestampDate(new Date(ISO)), DATE);
  });

  it("formats Date-like objects", () => {
    assert.equal(
      formatTimestampDate({ seconds: SEC, nanoseconds: 0 }),
      DATE,
    );
    assert.equal(
      formatTimestampDate({ _seconds: SEC, _nanoseconds: 0 }),
      DATE,
    );
    assert.equal(
      formatTimestampDate({ seconds: String(SEC), nanos: 0 }),
      DATE,
    );
    assert.equal(formatTimestampDate({ $date: ISO }), DATE);
    assert.equal(formatTimestampDate({ $date: MS }), DATE);
    assert.equal(
      formatTimestampDate({ toISOString: () => ISO }),
      DATE,
    );
    assert.equal(
      formatTimestampDate({ toDate: () => new Date(ISO) }),
      DATE,
    );
  });

  it("returns undefined for missing or invalid values", () => {
    assert.equal(formatTimestampDate(undefined), undefined);
    assert.equal(formatTimestampDate(null), undefined);
    assert.equal(formatTimestampDate(""), undefined);
    assert.equal(formatTimestampDate("   "), undefined);
    assert.equal(formatTimestampDate("not-a-date"), undefined);
    assert.equal(formatTimestampDate({}), undefined);
    assert.equal(formatTimestampDate(Number.NaN), undefined);
    assert.equal(formatTimestampDate(Number.POSITIVE_INFINITY), undefined);
    assert.equal(formatTimestampDate(false), undefined);
    assert.equal(formatTimestampDate(true), undefined);
  });
});

describe("parseTimestampToDate", () => {
  it("parses each supported shape to the same instant", () => {
    const expected = Date.parse(ISO);
    const shapes: unknown[] = [
      ISO,
      MS,
      SEC,
      String(MS),
      String(SEC),
      new Date(ISO),
      { seconds: SEC, nanoseconds: 0 },
      { _seconds: SEC, _nanoseconds: 0 },
      { $date: ISO },
      { toISOString: () => ISO },
      { toDate: () => new Date(ISO) },
    ];

    for (const shape of shapes) {
      const parsed = parseTimestampToDate(shape);
      assert.ok(parsed, `expected Date for ${JSON.stringify(shape)}`);
      assert.equal(parsed.getTime(), expected, `shape ${JSON.stringify(shape)}`);
    }
  });

  it("returns undefined for missing values", () => {
    assert.equal(parseTimestampToDate(undefined), undefined);
    assert.equal(parseTimestampToDate(null), undefined);
    assert.equal(parseTimestampToDate(""), undefined);
  });
});
