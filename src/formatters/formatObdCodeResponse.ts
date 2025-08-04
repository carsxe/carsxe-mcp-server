export function formatObdCodeResponse(
  data: import("../types/carsxe.js").CarsXEObdCodeResponse
): string {
  if (!data.success) {
    return `❌ OBD code lookup failed.`;
  }
  return [
    `### 🛠️ OBD Code Diagnosis`,
    data.code ? `**Code:** ${data.code}` : undefined,
    data.diagnosis ? `**Diagnosis:** ${data.diagnosis}` : undefined,
    data.date ? `**Date:** ${data.date.split("T")[0]}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}
