import { isOAuthAccessToken, normalizeAudience } from "./oauth.js";

/**
 * Owner and resident lookups. They return names, addresses, phones, and
 * emails. The ChatGPT OAuth surface does not register them. API-key clients
 * and other OAuth clients still do.
 */
export const CHATGPT_EXCLUDED_OWNERSHIP_TOOLS = [
  "get_ownership_by_vin",
  "get_ownership_by_person",
  "get_ownership_by_address",
  "get_ownership_by_zip",
] as const;

/** Resource ChatGPT sends (RFC 8707). Claude.ai and Cursor omit it today. */
export const CHATGPT_OAUTH_AUDIENCE = "https://mcp.carsxe.com/mcp";

export type IncomingCredential =
  | { kind: "missing" }
  | { kind: "api-key"; secret: string }
  | { kind: "oauth"; secret: string; userAgent: string | null };

/**
 * ChatGPT's plugin connector, including the daily tool rescan, calls MCP with
 * an OAuth access token and `User-Agent: openai-mcp/…` (Codex uses the same
 * prefix). ChatGPT also sends `resource=https://mcp.carsxe.com/mcp` on the
 * OAuth grant. After that grant is stored, introspection returns it as `aud`.
 * Current Claude.ai and Cursor OAuth clients omit `resource`, so their tokens
 * have no audience. An `X-API-Key`, `?key=`, or non-`mcp_at_` bearer is an
 * API-key client even if the User-Agent looks like OpenAI.
 */
export function isChatgptOauthSurface(input: {
  oauthAccessToken: boolean;
  userAgent?: string | null;
  audience?: string | null;
}): boolean {
  if (!input.oauthAccessToken) return false;
  if (isOpenAiMcpUserAgent(input.userAgent)) return true;
  return normalizeAudience(input.audience) === CHATGPT_OAUTH_AUDIENCE;
}

export function isOpenAiMcpUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return /(^|[\s;(])openai-mcp\//i.test(userAgent.trim());
}

export function classifyIncomingCredential(input: {
  xApiKey?: string | null;
  authorization?: string | null;
  queryKey?: string | null;
  userAgent?: string | null;
}): IncomingCredential {
  const apiKeyHeader = blankToNull(input.xApiKey);
  if (apiKeyHeader) return { kind: "api-key", secret: apiKeyHeader };

  const authorization = input.authorization?.trim() ?? "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(authorization.indexOf(" ") + 1).trim();
    if (!token) return { kind: "missing" };
    if (isOAuthAccessToken(token)) {
      return {
        kind: "oauth",
        secret: token,
        userAgent: blankToNull(input.userAgent),
      };
    }
    return { kind: "api-key", secret: token };
  }

  const queryKey = blankToNull(input.queryKey);
  if (queryKey) return { kind: "api-key", secret: queryKey };
  return { kind: "missing" };
}

function blankToNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
