/**
 * Upstream CarsXE timestamps are typed as strings in this repo, but live
 * responses (notably recalls-by-ymm) can send a number, Date-like object,
 * or omit the field. Never call `.split` / `.toString` on them directly.
 */

const MILLIS_THRESHOLD = 1e12;

function isBlank(value: unknown): boolean {
  return (
    value == null ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")
  );
}

function dateFromEpoch(value: number): Date | undefined {
  if (!Number.isFinite(value)) return undefined;
  const millis = Math.abs(value) < MILLIS_THRESHOLD ? value * 1000 : value;
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dateFromNumericString(value: string): Date | undefined {
  if (!/^-?\d+(\.\d+)?$/.test(value)) return undefined;
  return dateFromEpoch(Number(value));
}

function readSeconds(record: Record<string, unknown>): number | undefined {
  const raw = record.seconds ?? record._seconds;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && /^-?\d+(\.\d+)?$/.test(raw.trim())) {
    return Number(raw);
  }
  return undefined;
}

function readNanos(record: Record<string, unknown>): number {
  const raw = record.nanoseconds ?? record._nanoseconds ?? record.nanos;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && /^-?\d+(\.\d+)?$/.test(raw.trim())) {
    return Number(raw);
  }
  return 0;
}

function dateFromObject(value: object): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const record = value as Record<string, unknown>;

  const seconds = readSeconds(record);
  if (seconds !== undefined) {
    return dateFromEpoch(seconds * 1000 + readNanos(record) / 1e6);
  }

  if ("$date" in record) {
    return parseTimestampToDate(record.$date);
  }

  if (typeof record.toDate === "function") {
    try {
      const converted = (record.toDate as () => unknown)();
      if (converted instanceof Date && !Number.isNaN(converted.getTime())) {
        return converted;
      }
    } catch {
      // ignore Date-like converters that throw
    }
  }

  if (typeof record.toISOString === "function") {
    try {
      const iso = (record.toISOString as () => unknown)();
      if (typeof iso === "string") return parseTimestampToDate(iso);
    } catch {
      // ignore Date-like converters that throw
    }
  }

  return undefined;
}

export function parseTimestampToDate(value: unknown): Date | undefined {
  if (isBlank(value) || typeof value === "boolean") return undefined;

  if (typeof value === "number") return dateFromEpoch(value);
  if (typeof value === "bigint") return dateFromEpoch(Number(value));

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }
    const fromNumber = dateFromNumericString(trimmed);
    if (fromNumber) return fromNumber;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  if (value !== null && typeof value === "object") return dateFromObject(value);

  return undefined;
}

/** Format any supported timestamp as `YYYY-MM-DD`, or `undefined` if missing/invalid. */
export function formatTimestampDate(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  }

  const date = parseTimestampToDate(value);
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}
