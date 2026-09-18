import { z } from "zod";
import {
  carsxeApiPost,
  carsxeApiRequest,
  carsxeApiRequestText,
} from "../utils/carsxeApi.js";
import type {
  CarsXERecallsBatchResultsResponse,
  CarsXERecallsBatchStatusResponse,
  CarsXERecallsBatchSubmitResponse,
} from "../types/carsxe.js";
import {
  formatRecallsBatchDownload,
  formatRecallsBatchResultsResponse,
  formatRecallsBatchStatusResponse,
  formatRecallsBatchSubmitResponse,
} from "../formatters/carsxe.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const vinsSchema = z
  .union([
    z.array(z.string()),
    z.string().transform((value) =>
      value
        .split(/[\s,]+/)
        .map((vin) => vin.trim())
        .filter(Boolean),
    ),
  ])
  .optional()
  .describe(
    "17-character VINs as an array or comma-separated string. Combine with csv/csvUrl up to 10,000 unique VINs.",
  );

function missingKey() {
  return {
    content: [
      {
        type: "text" as const,
        text: "❌ API key not provided. Please ensure X-API-Key header is set.",
      },
    ],
  };
}

export function registerRecallsBatchTools(
  server: McpServer,
  getApiKey: () => string | null,
) {
  server.registerTool(
    "submit_recalls_batch",
    {
      title: "Submit Recalls Batch",
      description:
        "Submit an async bulk recall check for up to 10,000 VINs (JSON list, inline CSV, and/or CSV URL)",
      inputSchema: {
        vins: vinsSchema,
        csv: z
          .string()
          .optional()
          .describe("Inline CSV of VINs (one per line or a vin column)"),
        csvUrl: z
          .string()
          .url()
          .optional()
          .describe(
            "HTTPS URL to a CSV of VINs (Google Sheets, S3, Dropbox, etc.)",
          ),
        webhookUrl: z
          .string()
          .url()
          .optional()
          .describe("HTTPS webhook URL called when the batch finishes"),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ vins, csv, csvUrl, webhookUrl }) => {
      const apiKey = getApiKey();
      if (!apiKey) return missingKey();
      if (!vins?.length && !csv && !csvUrl) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Provide at least one of vins, csv, or csvUrl.",
            },
          ],
        };
      }
      const body: Record<string, unknown> = {};
      if (vins?.length) body.vins = vins;
      if (csv) body.csv = csv;
      if (csvUrl) body.csvUrl = csvUrl;
      if (webhookUrl) body.webhookUrl = webhookUrl;

      const data = await carsxeApiPost<CarsXERecallsBatchSubmitResponse>(
        "v1/recalls-batch/submit",
        body,
        apiKey,
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to submit recalls batch. Please check the VINs and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatRecallsBatchSubmitResponse(data),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_recalls_batch_status",
    {
      title: "Get Recalls Batch Status",
      description: "Check the status of a previously submitted recalls batch",
      inputSchema: {
        batchId: z
          .string()
          .describe("Batch ID returned by submit_recalls_batch"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ batchId }) => {
      const apiKey = getApiKey();
      if (!apiKey) return missingKey();
      const data = await carsxeApiRequest<CarsXERecallsBatchStatusResponse>(
        "v1/recalls-batch/status",
        { batchId },
        apiKey,
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve batch status. Please check the batch ID and try again.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatRecallsBatchStatusResponse(data),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_recalls_batch_results",
    {
      title: "Get Recalls Batch Results",
      description:
        "Fetch completed bulk recall results as JSON (use after status is completed or partial)",
      inputSchema: {
        batchId: z
          .string()
          .describe("Batch ID returned by submit_recalls_batch"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ batchId }) => {
      const apiKey = getApiKey();
      if (!apiKey) return missingKey();
      const data = await carsxeApiRequest<CarsXERecallsBatchResultsResponse>(
        "v1/recalls-batch/results",
        { batchId },
        apiKey,
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to retrieve batch results. Poll get_recalls_batch_status until completed or partial.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatRecallsBatchResultsResponse(data),
          },
        ],
      };
    },
  );

  server.registerTool(
    "download_recalls_batch",
    {
      title: "Download Recalls Batch CSV",
      description:
        "Download completed bulk recall results as CSV (use after status is completed or partial)",
      inputSchema: {
        batchId: z
          .string()
          .describe("Batch ID returned by submit_recalls_batch"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async ({ batchId }) => {
      const apiKey = getApiKey();
      if (!apiKey) return missingKey();
      const csv = await carsxeApiRequestText(
        "v1/recalls-batch/download",
        { batchId },
        apiKey,
      );
      if (!csv) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Failed to download batch CSV. Poll get_recalls_batch_status until completed or partial.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatRecallsBatchDownload(csv),
          },
        ],
      };
    },
  );
}
