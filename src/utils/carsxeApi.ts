import * as dotenv from "dotenv";
// import * as path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, "../../.env") });

export const CARSXE_API_BASE = "https://api.carsxe.com";

export type CarsxeFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type CarsxeApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; data?: unknown };

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/^\/+/, "");
}

export function buildCarsxeUrl(
  endpoint: string,
  apiKey: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): string {
  const queryParams = new URLSearchParams({
    key: apiKey,
    source: "mcp",
  });
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.set(key, String(value));
      }
    }
  }
  return `${CARSXE_API_BASE}/${normalizeEndpoint(endpoint)}?${queryParams.toString()}`;
}

export function compactJsonBody(
  body: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!body) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

export function extractCarsxeErrorMessage(
  status: number,
  parsed: unknown,
): string {
  if (parsed && typeof parsed === "object") {
    const rec = parsed as Record<string, unknown>;
    if (typeof rec.message === "string" && rec.message) return rec.message;
    if (typeof rec.error === "string" && rec.error) return rec.error;
    if (rec.error && typeof rec.error === "object") {
      const nested = (rec.error as { message?: unknown }).message;
      if (typeof nested === "string" && nested) return nested;
    }
  }
  if (typeof parsed === "string" && parsed.trim() && parsed.length < 400) {
    return parsed.trim();
  }
  if (status === 404) {
    return "Not found. Monitoring may be disabled for this account, or the monitor id does not exist.";
  }
  if (status === 401) {
    return "Authentication failed. Check that the API key is valid and active.";
  }
  if (status === 403) {
    return "Forbidden. This API key may not have access to Monitoring.";
  }
  if (status === 0) {
    return "Network error calling the CarsXE API.";
  }
  return `HTTP error! status: ${status}`;
}

export async function carsxeApiJson<T>(options: {
  endpoint: string;
  apiKey: string;
  method?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  fetchFn?: CarsxeFetch;
}): Promise<CarsxeApiResult<T>> {
  const method = (options.method ?? "GET").toUpperCase();
  const url = buildCarsxeUrl(options.endpoint, options.apiKey, options.query);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-API-Key": options.apiKey,
  };
  const init: RequestInit = { method, headers };
  if (options.body !== undefined && method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  try {
    const fetchFn = options.fetchFn ?? fetch;
    const response = await fetchFn(url, init);
    const text = await response.text();
    let parsed: unknown;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: extractCarsxeErrorMessage(response.status, parsed),
        data: parsed,
      };
    }

    if (response.status === 204 || parsed === undefined) {
      return { ok: true, status: response.status, data: { success: true } as T };
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "success" in parsed &&
      (parsed as { success: unknown }).success === false
    ) {
      return {
        ok: false,
        status: response.status,
        error: extractCarsxeErrorMessage(response.status, parsed),
        data: parsed,
      };
    }

    return { ok: true, status: response.status, data: parsed as T };
  } catch (error) {
    console.error(`Error making CarsXE request to ${options.endpoint}:`, error);
    return {
      ok: false,
      status: 0,
      error:
        error instanceof Error
          ? error.message
          : "Network error calling the CarsXE API.",
    };
  }
}

export async function carsxeApiRequest<T>(
  endpoint: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<T | null> {
  const url = buildCarsxeUrl(endpoint, apiKey, params);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Error making CarsXE request to ${endpoint}:`, error);
    return null;
  }
}
