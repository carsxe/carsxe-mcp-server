import type { CarsXERecallCampaignResponse } from "../types/carsxe.js";

const splitList = (value: string | undefined): string =>
  value
    ? value
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(", ")
    : "";

/**
 * `requestedMake` is the make as the caller typed it. The API echoes a lowercased
 * `input.make` ("volkswagen"), so it is only the fallback.
 */
export function formatRecallCampaignResponse(
  data: CarsXERecallCampaignResponse,
  requestedMake?: string,
): string {
  if (!data.success || !data.data) {
    return `❌ ${
      data.message ||
      "Failed to retrieve the recall campaign. Please check the make and campaign code and try again."
    }`;
  }
  const c = data.data;
  // Only NHTSA safety recalls carry a campaign number. Service campaigns and bulletins
  // never do, and get_vehicle_recalls cannot see them, so a VIN check there proves nothing.
  const isSafetyRecall = Boolean(c.nhtsa_campaign_number);
  const lines = [
    "### 🚨 Recall Campaign",
    `**Make:** ${requestedMake?.trim() || data.input?.make || "N/A"}`,
    `**Campaign Code:** ${c.campaign_code || data.input?.code || "N/A"}`,
    c.recall_class ? `**Type:** ${c.recall_class}` : null,
    `**NHTSA Campaign:** ${
      isSafetyRecall
        ? splitList(c.nhtsa_campaign_number)
        : "None (not an NHTSA safety recall)"
    }`,
    c.component ? `**Component:** ${c.component}` : null,
    c.models ? `**Models:** ${splitList(c.models)}` : null,
    c.model_years ? `**Model Years:** ${splitList(c.model_years)}` : null,
    "",
    c.description ? `**Description:** ${c.description}` : null,
    "",
    c.confidence === "medium (prose reference)"
      ? "⚠️ This code was matched from bulletin text rather than an identifier field; confirm it against the description."
      : null,
    isSafetyRecall
      ? "_A campaign covers a range of vehicles; use get_vehicle_recalls with a VIN to confirm a specific vehicle is affected._"
      : "_This is a manufacturer service campaign or bulletin, not an NHTSA safety recall, so get_vehicle_recalls will not list it. A dealer can confirm whether a specific VIN is covered._",
  ];

  if (data.timestamp) {
    lines.push(`**Report Generated:** ${data.timestamp.split("T")[0]}`);
  }

  return lines.filter((line) => line !== null).join("\n");
}
