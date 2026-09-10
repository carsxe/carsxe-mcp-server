import type { CarsXERecallsYmmResponse } from "../types/carsxe.js";

export function formatRecallsYmmResponse(
  data: CarsXERecallsYmmResponse,
): string {
  if (!data.success || !data.data) {
    return `❌ Failed to retrieve YMM recall information. ${
      data.message || "Please check the year, make, and model and try again."
    }`;
  }
  const v = data.data;
  const lines = [
    "### 🚨 Recalls by Year / Make / Model",
    `**Year:** ${v.model_year || data.input?.year || "N/A"}`,
    `**Make:** ${v.make || data.input?.make || "N/A"}`,
    `**Model:** ${v.model || data.input?.model || "N/A"}`,
    "",
    v.has_recalls
      ? `**This YMM has ${v.recall_count || 0} recall(s).**`
      : "✅ No recalls found for this year, make, and model.",
    "",
  ];

  if (v.recalls?.length) {
    v.recalls.forEach((recall, i) => {
      lines.push(
        [
          `**Recall ${i + 1}:**`,
          recall.nhtsa_campaign_number
            ? `- **NHTSA Campaign:** ${recall.nhtsa_campaign_number}`
            : null,
          recall.manufacturer
            ? `- **Manufacturer:** ${recall.manufacturer}`
            : null,
          recall.report_received_date
            ? `- **Report Received:** ${recall.report_received_date}`
            : null,
          recall.component ? `- **Component:** ${recall.component}` : null,
          recall.park_it !== undefined
            ? `- **Park It:** ${recall.park_it ? "Yes" : "No"}`
            : null,
          recall.park_outside !== undefined
            ? `- **Park Outside:** ${recall.park_outside ? "Yes" : "No"}`
            : null,
          recall.over_the_air_update !== undefined
            ? `- **Over-the-Air Update:** ${
                recall.over_the_air_update ? "Yes" : "No"
              }`
            : null,
          recall.summary ? `- **Summary:** ${recall.summary}` : null,
          recall.consequence ? `- **Consequence:** ${recall.consequence}` : null,
          recall.remedy ? `- **Remedy:** ${recall.remedy}` : null,
          recall.notes ? `- **Notes:** ${recall.notes}` : null,
          "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    });
  }

  if (data.timestamp) {
    lines.push(`**Report Generated:** ${data.timestamp.split("T")[0]}`);
  }

  return lines.filter(Boolean).join("\n");
}
