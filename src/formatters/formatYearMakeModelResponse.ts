export function formatYearMakeModelResponse(
  data: import("../types/carsxe.js").CarsXEYearMakeModelResponse
): string {
  if (!data.success) {
    return `❌ Year/Make/Model lookup failed. ${
      data.message || "Unknown error."
    }`;
  }
  if (!data.bestMatch) {
    return `No matching vehicle found for the specified year, make, and model.`;
  }
  const v = data.bestMatch;
  const lines = [
    `### 🚘 Year/Make/Model Lookup`,
    `**Name:** ${v.name}`,
    `**Year:** ${v.year}`,
    `**Make:** ${v.make}`,
    `**Model:** ${v.model}`,
    `**Base MSRP:** $${v.base_msrp.toLocaleString()}`,
    `**Base Invoice:** $${v.base_invoice.toLocaleString()}`,
    `**Seating:** ${v.total_seating}`,
    v.is_truck ? `**Truck:** Yes` : undefined,
    v.is_electric ? `**Electric:** Yes` : undefined,
    v.is_plugin_electric ? `**Plug-in Hybrid:** Yes` : undefined,
    "",
    v.color?.exterior?.length
      ? `**Exterior Colors:**\n${v.color.exterior
          .map((c: any) => `- ${c.name} (RGB: ${c.rgb})`)
          .join("\n")}`
      : undefined,
    v.color?.interior?.length
      ? `**Interior Colors:**\n${v.color.interior
          .map((c: any) => `- ${c.name} (RGB: ${c.rgb})`)
          .join("\n")}`
      : undefined,
    "",
    v.features?.standard?.length
      ? `**Standard Features:**\n${v.features.standard
          .map(
            (cat: any) =>
              `- **${cat.category}:**\n${cat.features
                .map(
                  (f: any) => `  - ${f.name}${f.value ? `: ${f.value}` : ""}`
                )
                .join("\n")}`
          )
          .join("\n")}`
      : undefined,
    v.features?.optional?.length
      ? `**Optional Features & Packages:**\n${v.features.optional
          .map(
            (cat: any) =>
              `- **${cat.category}:**\n${cat.features
                .map(
                  (f: any) =>
                    `  - ${f.name}${
                      f.price !== undefined && f.price !== null
                        ? ` ($${f.price})`
                        : ""
                    }`
                )
                .join("\n")}`
          )
          .join("\n")}`
      : undefined,
  ];
  return lines.filter(Boolean).join("\n\n");
}
