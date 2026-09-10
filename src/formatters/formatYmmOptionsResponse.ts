import type { CarsXEYmmOptionsResponse } from "../types/carsxe.js";

function listBlock(title: string, values?: Array<string | number>): string | null {
  if (!values?.length) return null;
  return `**${title} (${values.length}):**\n${values.map((v) => `- ${v}`).join("\n")}`;
}

export function formatYmmOptionsResponse(data: CarsXEYmmOptionsResponse): string {
  if (!data.success) {
    return `❌ YMM options lookup failed. ${data.message || "Unknown error."}`;
  }
  const input = data.input
    ? Object.entries(data.input)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `**${k}:** ${v}`)
        .join(" · ")
    : "";
  const lines = [
    "### 📋 Year / Make / Model Options",
    input || undefined,
    data.message || undefined,
    "",
    listBlock("Years", data.years),
    listBlock("Makes", data.makes),
    listBlock("Models", data.models),
    listBlock("Trims", data.trims),
    listBlock("Variants", data.variants),
    data.modelCount !== undefined
      ? `**Model count (billed units for bulk variants):** ${data.modelCount}`
      : undefined,
  ];
  return lines.filter((line) => line !== undefined && line !== "").join("\n\n");
}
