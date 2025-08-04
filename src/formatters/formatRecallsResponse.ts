import { CarsXERecallsResponse } from "../types/carsxe.js";

export function formatRecallsResponse(data: CarsXERecallsResponse): string {
  if (!data.success || !data.data) {
    return "❌ Failed to retrieve recall information. Please check the VIN and try again.";
  }
  const v = data.data;
  const lines = [
    "### 🚨 Vehicle Recall Report",
    `**VIN:** ${v.vin || data.input?.vin || "N/A"}`,
    `**Make:** ${v.make || "N/A"}`,
    `**Model:** ${v.model || "N/A"}`,
    `**Year:** ${v.model_year || "N/A"}`,
    `**Manufacturer:** ${v.manufacturer || "N/A"}`,
    "",
    v.has_recalls
      ? `**This vehicle has ${v.recall_count || 0} recall(s).**`
      : "✅ No recalls found for this vehicle.",
    "",
  ];

  if (v.recalls?.length) {
    v.recalls.forEach((recall, i) => {
      lines.push(
        [
          `**Recall ${i + 1}:**`,
          `- **Date Issued:** ${recall.recall_date || "N/A"}`,
          recall.expiration_date
            ? `- **Expiration Date:** ${recall.expiration_date}`
            : null,
          recall.nhtsa_id ? `- **NHTSA ID:** ${recall.nhtsa_id}` : null,
          recall.manufacturer_id
            ? `- **Manufacturer ID:** ${recall.manufacturer_id}`
            : null,
          recall.recall_campaign_type
            ? `- **Campaign Type:** ${recall.recall_campaign_type}`
            : null,
          recall.recall_name
            ? `- **Recall Name:** ${recall.recall_name}`
            : null,
          recall.component ? `- **Component:** ${recall.component}` : null,
          recall.recall_description
            ? `- **Description:** ${recall.recall_description}`
            : null,
          recall.risk_description
            ? `- **Risk:** ${recall.risk_description}`
            : null,
          recall.stop_sale !== null && recall.stop_sale !== undefined
            ? `- **Stop Sale:** ${recall.stop_sale ? "Yes" : "No"}`
            : null,
          recall.dont_drive !== null && recall.dont_drive !== undefined
            ? `- **Do Not Drive:** ${recall.dont_drive ? "Yes" : "No"}`
            : null,
          recall.remedy_available !== null &&
          recall.remedy_available !== undefined
            ? `- **Remedy Available:** ${
                recall.remedy_available ? "Yes" : "No"
              }`
            : null,
          recall.recall_remedy ? `- **Remedy:** ${recall.recall_remedy}` : null,
          recall.parts_available !== null &&
          recall.parts_available !== undefined
            ? `- **Parts Available:** ${recall.parts_available ? "Yes" : "No"}`
            : null,
          recall.labor_hours_min
            ? `- **Labor Hours (Min):** ${recall.labor_hours_min}`
            : null,
          recall.labor_hours_max
            ? `- **Labor Hours (Max):** ${recall.labor_hours_max}`
            : null,
          recall.recall_status ? `- **Status:** ${recall.recall_status}` : null,
          "",
        ]
          .filter(Boolean)
          .join("\n")
      );
    });
  }

  if (data.timestamp) {
    lines.push(`**Report Generated:** ${data.timestamp.split("T")[0]}`);
  }

  return lines.filter(Boolean).join("\n");
}
