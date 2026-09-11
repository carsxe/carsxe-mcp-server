/** MCP Apps HTML resource MIME type (RESOURCE_MIME_TYPE). */
export const RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";

export const UI_URIS = {
  vehicleCard: "ui://carsxe/vehicle-card.html",
  marketValue: "ui://carsxe/market-value.html",
  recalls: "ui://carsxe/recalls.html",
} as const;

export type UiUri = (typeof UI_URIS)[keyof typeof UI_URIS];

/** Official Logo component assets from https://ui.carsxe.com */
export const BRAND_LOGO_LIGHT = "https://ui.carsxe.com/logo-light.png";
export const BRAND_LOGO_DARK = "https://ui.carsxe.com/logo-dark.png";

/** CSP allowlist so the iframe can load official brand assets. */
export const UI_RESOURCE_DOMAINS = ["https://ui.carsxe.com"] as const;

/** Published light tokens from @carsxe/design-system / ui.carsxe.com/docs/theming */
export const DESIGN_TOKENS = {
  primary: "#065774",
  foreground: "#3A3A3A",
  background: "#F9F9F9",
  muted: "#F9F9F9",
  border: "#EBEBEB",
  card: "#FFFFFF",
  /** Published token in globals.css */
  radius: "0",
  /** Tailwind rounded-2xl used by Card/Button/Badge on ui.carsxe.com */
  radius2xl: "1rem",
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
