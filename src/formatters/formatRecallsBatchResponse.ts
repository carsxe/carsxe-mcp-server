import type {
  CarsXERecallsBatchJob,
  CarsXERecallsBatchResultsResponse,
  CarsXERecallsBatchStatusResponse,
  CarsXERecallsBatchSubmitResponse,
} from "../types/carsxe.js";

function formatJob(job: CarsXERecallsBatchJob): string[] {
  return [
    job.batchId ? `**Batch ID:** ${job.batchId}` : null,
    job.status ? `**Status:** ${job.status}` : null,
    job.totalVins !== undefined ? `**Total VINs:** ${job.totalVins}` : null,
    job.processedVins !== undefined
      ? `**Processed VINs:** ${job.processedVins}`
      : null,
    job.hitCount !== undefined ? `**Recall Hits:** ${job.hitCount}` : null,
    job.hitRate !== undefined ? `**Hit Rate:** ${job.hitRate}%` : null,
    job.createdAt ? `**Created:** ${job.createdAt}` : null,
    job.updatedAt ? `**Updated:** ${job.updatedAt}` : null,
    job.completedAt ? `**Completed:** ${job.completedAt}` : null,
    job.errorMessage ? `**Error:** ${job.errorMessage}` : null,
  ].filter((line): line is string => Boolean(line));
}

export function formatRecallsBatchSubmitResponse(
  data: CarsXERecallsBatchSubmitResponse,
): string {
  if (!data.success || !data.data) {
    return `❌ Failed to submit recalls batch. ${data.message || "Unknown error."}`;
  }
  const lines = [
    "### 📦 Recalls Batch Submitted",
    ...formatJob(data.data),
    "",
    data.message ||
      "Poll `get_recalls_batch_status` until status is `completed` or `partial`, then use `get_recalls_batch_results` or `download_recalls_batch`.",
  ];
  return lines.join("\n");
}

export function formatRecallsBatchStatusResponse(
  data: CarsXERecallsBatchStatusResponse,
): string {
  if (!data.success || !data.data) {
    return `❌ Failed to retrieve batch status. ${data.message || "Unknown error."}`;
  }
  const status = data.data.status;
  const ready = status === "completed" || status === "partial";
  const lines = [
    "### 📦 Recalls Batch Status",
    ...formatJob(data.data),
    "",
    ready
      ? "Results are ready. Use `get_recalls_batch_results` or `download_recalls_batch`."
      : status === "failed"
        ? "Batch failed. See the error above."
        : "Batch is still processing. Poll this tool again shortly.",
  ];
  return lines.join("\n");
}

export function formatRecallsBatchResultsResponse(
  data: CarsXERecallsBatchResultsResponse,
): string {
  if (!data.success || !data.data) {
    return `❌ Failed to retrieve batch results. ${
      data.message || "Check status first — results are only available when completed or partial."
    }`;
  }
  const job = data.data.job;
  const results = data.data.results ?? [];
  const previewLimit = 25;
  const lines = [
    "### 📦 Recalls Batch Results",
    ...(job ? formatJob(job) : []),
    "",
    `**VIN rows:** ${results.length}`,
    "",
  ];

  for (const row of results.slice(0, previewLimit)) {
    lines.push(
      `**${row.vin}** — ${
        row.hasRecalls
          ? `${row.recallCount} recall(s)`
          : "✅ No safety recalls"
      }`,
    );
    if (row.hasRecalls && row.recalls?.length) {
      for (const recall of row.recalls.slice(0, 5)) {
        const id =
          recall.recallNhtsaNumber ||
          recall.recallOemNumber ||
          recall.nhtsa_campaign_number ||
          "Recall";
        const title = recall.recallTitle || recall.recall_name || "";
        lines.push(`  - ${id}${title ? `: ${title}` : ""}`);
      }
      if (row.recalls.length > 5) {
        lines.push(`  - …and ${row.recalls.length - 5} more`);
      }
    }
    lines.push("");
  }

  if (results.length > previewLimit) {
    lines.push(
      `_Showing first ${previewLimit} of ${results.length} VINs. Use \`download_recalls_batch\` for the full CSV._`,
    );
  }

  return lines.join("\n");
}

export function formatRecallsBatchDownload(csv: string): string {
  const lines = csv.replace(/\r\n/g, "\n").split("\n");
  const previewLimit = 30;
  const preview = lines.slice(0, previewLimit).join("\n");
  const truncated = lines.length > previewLimit;
  return [
    "### 📦 Recalls Batch CSV",
    truncated
      ? `Showing first ${previewLimit} of ${lines.length} lines.`
      : `${lines.length} line(s).`,
    "",
    "```csv",
    preview,
    "```",
  ].join("\n");
}
