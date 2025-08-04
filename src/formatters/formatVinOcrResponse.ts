export function formatVinOcrResponse(
  data: import("../types/carsxe.js").CarsXEVinOcrResponse
): string {
  if (!data.success) {
    return `❌ VIN OCR failed. ${data.message || "Unknown error."}`;
  }
  if (!data.vin) {
    return `No VIN detected in the image.`;
  }
  const lines = [
    `### 🔍 VIN OCR Results`,
    data.vin ? `**VIN:** ${data.vin}` : "",
    data.confidence !== undefined
      ? `**Confidence:** ${(data.confidence * 100).toFixed(1)}%`
      : "",
    data.box
      ? `**Bounding Box:** [xmin: ${data.box.xmin}, xmax: ${data.box.xmax}, ymin: ${data.box.ymin}, ymax: ${data.box.ymax}]`
      : "",
    "",
    data.candidates && data.candidates.length > 0
      ? `**Candidates:**\n${data.candidates
          .map(
            (c: any) =>
              `- ${c.vin} (${(c.confidence * 100).toFixed(1)}%) [xmin: ${
                c.box.xmin
              }, xmax: ${c.box.xmax}, ymin: ${c.box.ymin}, ymax: ${c.box.ymax}]`
          )
          .join("\n")}`
      : "",
  ];
  return lines.filter(Boolean).join("\n");
}
