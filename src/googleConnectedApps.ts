import type http from "node:http";

export const GOOGLE_CONNECTED_APPS_PATH =
  "/.well-known/google-connected-apps";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";

const NOT_CONFIGURED_BODY = JSON.stringify({
  error: "not_found",
  error_description: "Google Connected Apps verification is not configured",
});

const INVALID_JSON_BODY = JSON.stringify({
  error: "server_error",
  error_description: "Google Connected Apps verification is not valid JSON",
});

export function resolveGoogleConnectedAppsVerification(
  raw: string | undefined,
): { status: number; body: string } {
  if (raw == null || raw.trim() === "") {
    return { status: 404, body: NOT_CONFIGURED_BODY };
  }

  try {
    JSON.parse(raw);
    return { status: 200, body: raw };
  } catch {
    const trimmed = raw.trim();
    try {
      JSON.parse(trimmed);
      return { status: 200, body: trimmed };
    } catch {
      return { status: 500, body: INVALID_JSON_BODY };
    }
  }
}

/**
 * Serves Google Connected Apps domain verification with no redirects.
 * GET and HEAD are accepted; other methods return 405.
 */
export function handleGoogleConnectedApps(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
  envValue: string | undefined = process.env.GOOGLE_CONNECTED_APPS_VERIFICATION,
): boolean {
  if (url.pathname !== GOOGLE_CONNECTED_APPS_PATH) return false;

  const method = (req.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const body = JSON.stringify({
      error: "invalid_request",
      error_description: "Use GET or HEAD",
    });
    res.writeHead(405, {
      Allow: "GET, HEAD",
      "Content-Type": JSON_CONTENT_TYPE,
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
    return true;
  }

  const { status, body } = resolveGoogleConnectedAppsVerification(envValue);
  res.writeHead(status, {
    "Content-Type": JSON_CONTENT_TYPE,
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(method === "HEAD" ? undefined : body);
  return true;
}
