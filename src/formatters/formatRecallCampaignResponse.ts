import type { CarsXERecallCampaignResponse } from "../types/carsxe.js";

const splitList = (value: string | undefined): string =>
  value
    ? value
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(", ")
    : "";

export function formatRecallCampaignResponse(
  data: CarsXERecallCampaignResponse,
): string {
  if (!data.success || !data.data) {
    return `❌ ${
      data.message ||
      "Failed to retrieve the recall campaign. Please check the make and campaign code and try again."
    }`;
  }
  const c = data.data;
  const lines = [
    "### 🚨 Recall Campaign",
    `**Make:** ${data.input?.make || "N/A"}`,
    `**Campaign Code:** ${c.campaign_code || data.input?.code || "N/A"}`,
    c.recall_class ? `**Type:** ${c.recall_class}` : null,
    c.nhtsa_campaign_number
      ? `**NHTSA Campaign:** ${splitList(c.nhtsa_campaign_number)}`
      : null,
    c.component ? `**Component:** ${c.component}` : null,
    c.models ? `**Models:** ${splitList(c.models)}` : null,
    c.model_years ? `**Model Years:** ${splitList(c.model_years)}` : null,
    "",
    c.description ? `**Description:** ${c.description}` : null,
    "",
    c.confidence === "medium (prose reference)"
      ? "⚠️ This code was matched from bulletin text rather than an identifier field; confirm it against the description."
      : null,
    "_A campaign covers a range of vehicles; use get_vehicle_recalls with a VIN to confirm a specific vehicle is affected._",
  ];

  if (data.timestamp) {
    lines.push(`**Report Generated:** ${data.timestamp.split("T")[0]}`);
  }

  return lines.filter((line) => line !== null).join("\n");
}
