/** MCP Apps HTML resource MIME type (RESOURCE_MIME_TYPE). */
export const RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";

export const UI_URIS = {
  vehicleCard: "ui://carsxe/vehicle-card.html",
  marketValue: "ui://carsxe/market-value.html",
  recalls: "ui://carsxe/recalls.html",
} as const;

export type UiUri = (typeof UI_URIS)[keyof typeof UI_URIS];

/** Official lockups from https://ui.carsxe.com/docs/brand */
export const BRAND_LOGO_LIGHT =
  "https://ui.carsxe.com/brand/carsxe-horizontal.svg";
export const BRAND_LOGO_DARK =
  "https://ui.carsxe.com/brand/carsxe-horizontal-on-dark.svg";

/** CSP allowlist so the iframe can load official brand assets. */
export const UI_RESOURCE_DOMAINS = ["https://ui.carsxe.com"] as const;

/** Published light tokens from @carsxe/design-system / ui.carsxe.com/docs/theming */
export const DESIGN_TOKENS = {
  primary: "#065774",
  foreground: "#3A3A3A",
  background: "#F9F9F9",
  radius: "0",
} as const;

/** Tool _meta for MCP Apps + ChatGPT outputTemplate alias. */
export function uiToolMeta(resourceUri: UiUri): Record<string, unknown> {
  return {
    ui: { resourceUri },
    "openai/outputTemplate": resourceUri,
    "ui/resourceUri": resourceUri,
    "openai/toolInvocation/invoking": "Rendering…",
    "openai/toolInvocation/invoked": "Rendered.",
  };
}

export function toolHasUiResourceUri(meta: unknown): boolean {
  if (!meta || typeof meta !== "object") return false;
  const record = meta as Record<string, unknown>;
  const nested = record.ui as { resourceUri?: unknown } | undefined;
  return (
    typeof nested?.resourceUri === "string" ||
    typeof record["openai/outputTemplate"] === "string" ||
    typeof record["ui/resourceUri"] === "string"
  );
}
