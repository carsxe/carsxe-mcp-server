export function formatPlateRecognitionResponse(
  data: import("../types/carsxe.js").CarsXEPlateRecognitionResponse
): string {
  if (!data.success) {
    return `❌ Plate recognition failed. ${data.message || "Unknown error."}`;
  }
  if (!data.results || data.results.length === 0) {
    return `No plates detected in the image.`;
  }
  const lines = [
    `### 🏷️ Plate Recognition Results`,
    data.filename ? `**File:** ${data.filename}` : "",
    data.processing_time
      ? `**Processing Time:** ${data.processing_time} ms`
      : "",
    "",
    ...data.results.map((result: any, i: number) => {
      const best = result.candidates?.[0];
      return [
        `**Plate ${i + 1}:**`,
        best
          ? `- **Best Candidate:** \
          \t **Plate:** \
          \t\t\t${best.plate}
          \t **Confidence:**
          ${(best.score * 100).toFixed(1)}%`
          : null,
        result.candidates && result.candidates.length > 1
          ? `- **Other Candidates:**\n${result.candidates
              .slice(1)
              .map(
                (c: any) => `  - ${c.plate} (${(c.score * 100).toFixed(1)}%)`
              )
              .join("\n")}`
          : null,
        result.region
          ? `- **Region:** ${result.region.code} (${(
              result.region.score * 100
            ).toFixed(1)}%)`
          : null,
        result.vehicle
          ? `- **Vehicle Type:** ${result.vehicle.type} (${(
              result.vehicle.score * 100
            ).toFixed(1)}%)`
          : null,
        result.box
          ? `- **Bounding Box:** [xmin: ${result.box.xmin}, xmax: ${result.box.xmax}, ymin: ${result.box.ymin}, ymax: ${result.box.ymax}]`
          : null,
        result.dscore !== undefined
          ? `- **Detection Score:** ${(result.dscore * 100).toFixed(1)}%`
          : null,
        result.score !== undefined
          ? `- **Plate Score:** ${(result.score * 100).toFixed(1)}%`
          : null,
        "",
      ]
        .filter(Boolean)
        .join("\n");
    }),
  ];
  return lines.filter(Boolean).join("\n\n");
}
