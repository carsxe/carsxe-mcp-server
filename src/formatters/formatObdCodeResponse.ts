import { formatTimestampDate } from "../utils/formatTimestamp.js";

export function formatObdCodeResponse(
  data: import("../types/carsxe.js").CarsXEObdCodeResponse,
): string {
  if (!data.success) {
    return `❌ OBD code lookup failed.`;
  }
  const date = formatTimestampDate(data.date);
  return [
    `### 🛠️ OBD Code Diagnosis`,
    data.code ? `**Code:** ${data.code}` : undefined,
    data.diagnosis ? `**Diagnosis:** ${data.diagnosis}` : undefined,
    date ? `**Date:** ${date}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}
