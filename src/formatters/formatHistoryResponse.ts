import { CarsXEHistoryResponse } from "../types/carsxe.js";

export function formatHistoryResponse(data: CarsXEHistoryResponse): string {
  const lines = [
    `### 🕓 Vehicle History Report`,
    `**VIN:** ${data.vin}`,
    data.success ? "✅ History data found." : "❌ No history data found.",
    "",
  ];

  if (data.junkAndSalvageInformation?.length) {
    lines.push("**Junk & Salvage Records:**");
    data.junkAndSalvageInformation.forEach((rec) => {
      const ent = rec.ReportingEntityAbstract || {};
      lines.push(
        `- **Entity:** ${ent.EntityName || "N/A"} (${
          ent.LocationCityName || ""
        }, ${ent.LocationStateUSPostalServiceCode || ""})`,
        `  - **Obtained Date:** ${
          rec.VehicleObtainedDate
            ? rec.VehicleObtainedDate.split("T")[0]
            : "N/A"
        }`,
        `  - **Disposition:** ${rec.VehicleDispositionText || "N/A"}`,
        `  - **Intended for Export:** ${
          rec.VehicleIntendedForExportCode === "Y" ? "Yes" : "No"
        }`
      );
    });
    lines.push("");
  }

  if (data.insuranceInformation?.length) {
    lines.push("**Insurance Records:**");
    data.insuranceInformation.forEach((rec) => {
      const ent = rec.ReportingEntityAbstract || {};
      lines.push(
        `- **Insurer:** ${ent.EntityName || "N/A"} (${
          ent.LocationCityName || ""
        }, ${ent.LocationStateUSPostalServiceCode || ""})`,
        `  - **Obtained Date:** ${
          rec.VehicleObtainedDate
            ? rec.VehicleObtainedDate.split("T")[0]
            : "N/A"
        }`
      );
    });
    lines.push("");
  }

  if (data.brandsInformation?.length) {
    lines.push("**Brand Records:**");
    data.brandsInformation.forEach((brand) => {
      lines.push(
        `- **${brand.name || brand.code}:** ${brand.description || ""}`
      );
    });
    lines.push("");
  }

  if (data.currentTitleInformation?.length) {
    lines.push("**Current Title Information:**");
    data.currentTitleInformation.forEach((rec) => {
      lines.push(
        `- **Authority:** ${rec.TitleIssuingAuthorityName || "N/A"}`,
        `  - **Issue Date:** ${
          rec.TitleIssueDate?.Date
            ? rec.TitleIssueDate.Date.split("T")[0]
            : "N/A"
        }`,
        `  - **Odometer:** ${rec.VehicleOdometerReadingMeasure || "N/A"} ${
          rec.VehicleOdometerReadingUnitCode || ""
        }`
      );
      if (rec.HistoricTitleAbstract?.length) {
        lines.push("  - **Historic Titles:**");
        rec.HistoricTitleAbstract.forEach((h: any) => {
          lines.push(
            `    - **Date:** ${
              h.TitleIssueDate?.Date
                ? h.TitleIssueDate.Date.split("T")[0]
                : "N/A"
            }, **Odometer:** ${h.VehicleOdometerReadingMeasure || "N/A"} ${
              h.VehicleOdometerReadingUnitCode || ""
            }`
          );
        });
      }
    });
    lines.push("");
  }

  if (data.historyInformation?.length) {
    lines.push("**Historical Records:**");
    data.historyInformation.forEach((rec) => {
      lines.push(
        `- **Authority:** ${rec.TitleIssuingAuthorityName || "N/A"}`,
        `  - **Date:** ${
          rec.TitleIssueDate?.Date
            ? rec.TitleIssueDate.Date.split("T")[0]
            : "N/A"
        }`,
        `  - **Odometer:** ${rec.VehicleOdometerReadingMeasure || "N/A"} ${
          rec.VehicleOdometerReadingUnitCode || ""
        }`
      );
    });
    lines.push("");
  }

  if (data.vinChanged !== undefined) {
    lines.push(`**VIN Changed:** ${data.vinChanged ? "Yes" : "No"}`);
  }

  if (data.status) {
    lines.push(`**Status:** ${data.status}`);
  }

  if (data.error) {
    lines.push(
      `**Error:** ${data.error.code || ""} ${data.error.message || ""}`
    );
  }

  return lines.filter(Boolean).join("\n");
}
