import { CarsXELienTheftResponse } from "../types/carsxe.js";

export function formatLienTheftResponse(data: CarsXELienTheftResponse): string {
  const lines = [
    `### 🔒 Lien & Theft Information`,
    `**VIN:** ${data.input.vin}`,
    data.success
      ? "✅ Lien/theft data retrieved."
      : "❌ No lien/theft data found.",
    "",
  ];

  // Vehicle Information
  if (data.year || data.make || data.model) {
    lines.push("**Vehicle:**");
    lines.push(
      `${data.year || ""} ${data.make || ""} ${data.model || ""}`.trim(),
    );
    if (data.type) {
      lines.push(`**Type:** ${data.type}`);
    }
    lines.push("");
  }

  // Events (Lien & Theft Records)
  if (data.events && data.events.length > 0) {
    lines.push("**Events:**");
    data.events.forEach((event) => {
      lines.push(`- **${event.event}**`);
      if (event.location) {
        lines.push(`  - **Location:** ${event.location}`);
      }
      if (event.details_list && event.details_list.length > 0) {
        event.details_list.forEach((detail) => {
          lines.push(`  - ${detail}`);
        });
      }
      lines.push("");
    });
  } else {
    lines.push("**Events:** No lien or theft events found.", "");
  }

  // Trim Data
  if (data.trim_data) {
    lines.push("**Vehicle Details:**");

    // General Information
    if (data.trim_data.General) {
      lines.push("", "**General:**");
      Object.entries(data.trim_data.General).forEach(([key, value]) => {
        if (value) lines.push(`- **${key}:** ${value}`);
      });
    }

    // Engine
    if (data.trim_data.Engine) {
      lines.push("", "**Engine:**");
      Object.entries(data.trim_data.Engine).forEach(([key, value]) => {
        if (value) lines.push(`- **${key}:** ${value}`);
      });
    }

    // Mechanical
    if (data.trim_data.Mechanical) {
      lines.push("", "**Mechanical:**");
      Object.entries(data.trim_data.Mechanical).forEach(([key, value]) => {
        if (value) lines.push(`- **${key}:** ${value}`);
      });
    }

    // Exterior
    if (data.trim_data.Exterior) {
      lines.push("", "**Exterior:**");
      Object.entries(data.trim_data.Exterior).forEach(([key, value]) => {
        if (value && value !== "Not Applicable") {
          lines.push(`- **${key}:** ${value}`);
        }
      });
    }

    // Safety
    if (data.trim_data["Passive Safety System"]) {
      lines.push("", "**Safety:**");
      Object.entries(data.trim_data["Passive Safety System"]).forEach(
        ([key, value]) => {
          if (value) lines.push(`- **${key}:** ${value}`);
        },
      );
    }

    // Interior
    if (data.trim_data.Interior) {
      lines.push("", "**Interior:**");
      Object.entries(data.trim_data.Interior).forEach(([key, value]) => {
        if (value) lines.push(`- **${key}:** ${value}`);
      });
    }
  }

  if (data.timestamp) {
    lines.push(
      "",
      `**Timestamp:** ${new Date(data.timestamp).toLocaleString()}`,
    );
  }

  if (data.error) {
    lines.push(
      "",
      `**Error:** ${data.error.message || "Unknown error"}`,
      data.error.code ? `**Error Code:** ${data.error.code}` : "",
    );
  }

  return lines.join("\n");
}
