import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { carsxeApiJson, type CarsxeFetch } from "../utils/carsxeApi.js";
import type { CarsXEMonitorsResponse } from "../types/carsxe.js";
import {
  MISSING_API_KEY_MESSAGE,
  buildCreateMonitorBody,
  buildImportMonitorBody,
  buildUpdateMonitorBody,
  monitorAlertsPath,
  monitorCollectionPath,
  monitorImportPath,
  monitorItemPath,
  monitorRunPath,
  type CreateMonitorInput,
  type ImportMonitorInput,
  type UpdateMonitorInput,
} from "../utils/monitorsApi.js";
import {
  formatMonitorAlerts,
  formatMonitorDeleted,
  formatMonitorDetail,
  formatMonitorError,
  formatMonitorImport,
  formatMonitorList,
  formatMonitorRun,
} from "../formatters/formatMonitorsResponse.js";

const MONITORS_TOOL_NOTE =
  "CarsXE Monitoring watchlists (gated; 404 if disabled). See https://docs.carsxe.com/docs";

function textResult(text: string) {
  return {
    content: [{ type: "text" as const, text }],
  };
}

function missingApiKey() {
  return textResult(MISSING_API_KEY_MESSAGE);
}

const scheduleSchema = z
  .object({
    frequency: z
      .string()
      .min(1)
      .describe("How often to check, e.g. hourly, daily, weekly"),
    timezone: z
      .string()
      .optional()
      .describe("IANA timezone for the schedule, e.g. America/New_York"),
  })
  .describe("Check schedule");

export async function handleListMonitors(
  getApiKey: () => string | null,
  args: { limit?: number } = {},
  fetchFn?: CarsxeFetch,
) {
  const apiKey = getApiKey();
  if (!apiKey) return missingApiKey();

  const result = await carsxeApiJson<CarsXEMonitorsResponse>({
    apiKey,
    endpoint: monitorCollectionPath(),
    method: "GET",
    query: { limit: args.limit },
    fetchFn,
  });
  if (!result.ok) return textResult(formatMonitorError(result.error));
  return textResult(formatMonitorList(result.data));
}

export async function handleGetMonitor(
  getApiKey: () => string | null,
  args: { id: string },
  fetchFn?: CarsxeFetch,
) {
  const apiKey = getApiKey();
  if (!apiKey) return missingApiKey();

  const result = await carsxeApiJson<CarsXEMonitorsResponse>({
    apiKey,
    endpoint: monitorItemPath(args.id),
    method: "GET",
    fetchFn,
  });
  if (!result.ok) return textResult(formatMonitorError(result.error));
  return textResult(formatMonitorDetail(result.data, args.id));
}

export async function handleCreateMonitor(
  getApiKey: () => string | null,
  args: CreateMonitorInput,
  fetchFn?: CarsxeFetch,
) {
  const apiKey = getApiKey();
  if (!apiKey) return missingApiKey();

  const result = await carsxeApiJson<CarsXEMonitorsResponse>({
    apiKey,
    endpoint: monitorCollectionPath(),
    method: "POST",
    body: buildCreateMonitorBody(args),
    fetchFn,
  });
  if (!result.ok) return textResult(formatMonitorError(result.error));
  return textResult(formatMonitorDetail(result.data));
}

export async function handleUpdateMonitor(
  getApiKey: () => string | null,
  args: UpdateMonitorInput & { id: string },
  fetchFn?: CarsxeFetch,
) {
  const apiKey = getApiKey();
  if (!apiKey) return missingApiKey();

  const { id, ...fields } = args;
  const body = buildUpdateMonitorBody(fields);
  if (!body) {
    return textResult(
      formatMonitorError(
        "Provide at least one field to update (name, vehicles, products, schedule, delivery, or paused).",
      ),
    );
  }

  const result = await carsxeApiJson<CarsXEMonitorsResponse>({
    apiKey,
    endpoint: monitorItemPath(id),
    method: "PATCH",
    body,
    fetchFn,
  });
  if (!result.ok) return textResult(formatMonitorError(result.error));
  return textResult(formatMonitorDetail(result.data, id));
}

export async function handleDeleteMonitor(
  getApiKey: () => string | null,
  args: { id: string },
  fetchFn?: CarsxeFetch,
) {
  const apiKey = getApiKey();
  if (!apiKey) return missingApiKey();

  const result = await carsxeApiJson<CarsXEMonitorsResponse>({
    apiKey,
    endpoint: monitorItemPath(args.id),
    method: "DELETE",
    fetchFn,
  });
  if (!result.ok) return textResult(formatMonitorError(result.error));
  return textResult(formatMonitorDeleted(args.id));
}

export async function handleImportMonitorVehicles(
  getApiKey: () => string | null,
  args: ImportMonitorInput & { id: string },
  fetchFn?: CarsxeFetch,
) {
  const apiKey = getApiKey();
  if (!apiKey) return missingApiKey();

  const { id, ...fields } = args;
  const body = buildImportMonitorBody(fields);
  if (!body) {
    return textResult(
      formatMonitorError("Provide vehicles[] and/or csv to import."),
    );
  }

  const result = await carsxeApiJson<CarsXEMonitorsResponse>({
    apiKey,
    endpoint: monitorImportPath(id),
    method: "POST",
    body,
    fetchFn,
  });
  if (!result.ok) return textResult(formatMonitorError(result.error));
  return textResult(formatMonitorImport(result.data, id));
}

export async function handleRunMonitor(
  getApiKey: () => string | null,
  args: { id: string },
  fetchFn?: CarsxeFetch,
) {
  const apiKey = getApiKey();
  if (!apiKey) return missingApiKey();

  const result = await carsxeApiJson<CarsXEMonitorsResponse>({
    apiKey,
    endpoint: monitorRunPath(args.id),
    method: "POST",
    body: {},
    fetchFn,
  });
  if (!result.ok) return textResult(formatMonitorError(result.error));
  return textResult(formatMonitorRun(result.data, args.id));
}

export async function handleListMonitorAlerts(
  getApiKey: () => string | null,
  args: { id?: string; limit?: number } = {},
  fetchFn?: CarsxeFetch,
) {
  const apiKey = getApiKey();
  if (!apiKey) return missingApiKey();

  const result = await carsxeApiJson<CarsXEMonitorsResponse>({
    apiKey,
    endpoint: monitorAlertsPath(args.id),
    method: "GET",
    query: { limit: args.limit },
    fetchFn,
  });
  if (!result.ok) return textResult(formatMonitorError(result.error));
  return textResult(formatMonitorAlerts(result.data, args.id));
}

export function registerMonitorsTools(
  server: McpServer,
  getApiKey: () => string | null,
) {
  server.registerTool(
    "list_monitors",
    {
      title: "List Monitors",
      description: `List Monitoring watchlists for this API key. ${MONITORS_TOOL_NOTE}`,
      inputSchema: {
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Maximum number of monitors to return"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => handleListMonitors(getApiKey, args),
  );

  server.registerTool(
    "get_monitor",
    {
      title: "Get Monitor",
      description: `Get one Monitoring watchlist by id. ${MONITORS_TOOL_NOTE}`,
      inputSchema: {
        id: z.string().min(1).describe("Monitor id"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => handleGetMonitor(getApiKey, args),
  );

  server.registerTool(
    "create_monitor",
    {
      title: "Create Monitor",
      description: `Create a Monitoring watchlist (name, VIN or plate vehicles, products, schedule, delivery). ${MONITORS_TOOL_NOTE}`,
      inputSchema: {
        name: z.string().min(1).describe("Watchlist name"),
        vehicleType: z
          .enum(["vin", "plate"])
          .describe("Identifier type for vehicles in this monitor"),
        vehicles: z
          .array(z.string().min(1))
          .min(1)
          .describe("VINs or license plates to watch"),
        products: z
          .array(z.string().min(1))
          .min(1)
          .describe("Products to check, e.g. recalls"),
        schedule: scheduleSchema,
        delivery: z
          .array(z.string().min(1))
          .min(1)
          .describe("Delivery channels, e.g. email"),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => handleCreateMonitor(getApiKey, args),
  );

  server.registerTool(
    "update_monitor",
    {
      title: "Update Monitor",
      description: `Update a Monitoring watchlist, including pause/resume via paused. ${MONITORS_TOOL_NOTE}`,
      inputSchema: {
        id: z.string().min(1).describe("Monitor id"),
        name: z.string().min(1).optional().describe("New watchlist name"),
        vehicleType: z
          .enum(["vin", "plate"])
          .optional()
          .describe("Identifier type for vehicles"),
        vehicles: z
          .array(z.string().min(1))
          .optional()
          .describe("Replace the vehicle list"),
        products: z
          .array(z.string().min(1))
          .optional()
          .describe("Replace watched products"),
        schedule: scheduleSchema.optional(),
        delivery: z
          .array(z.string().min(1))
          .optional()
          .describe("Replace delivery channels"),
        paused: z
          .boolean()
          .optional()
          .describe("true to pause the monitor, false to resume"),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => handleUpdateMonitor(getApiKey, args),
  );

  server.registerTool(
    "delete_monitor",
    {
      title: "Delete Monitor",
      description: `Permanently delete a Monitoring watchlist. ${MONITORS_TOOL_NOTE}`,
      inputSchema: {
        id: z.string().min(1).describe("Monitor id"),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: true,
      },
    },
    async (args) => handleDeleteMonitor(getApiKey, args),
  );

  server.registerTool(
    "import_monitor_vehicles",
    {
      title: "Import Monitor Vehicles",
      description: `Import VINs or plates into a monitor (list or CSV). ${MONITORS_TOOL_NOTE}`,
      inputSchema: {
        id: z.string().min(1).describe("Monitor id"),
        vehicles: z
          .array(z.string().min(1))
          .optional()
          .describe("Vehicles to add"),
        csv: z
          .string()
          .optional()
          .describe("Raw CSV of VINs or plates to import"),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => handleImportMonitorVehicles(getApiKey, args),
  );

  server.registerTool(
    "run_monitor",
    {
      title: "Run Monitor Now",
      description: `Trigger an immediate Monitoring check for a watchlist. ${MONITORS_TOOL_NOTE}`,
      inputSchema: {
        id: z.string().min(1).describe("Monitor id"),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => handleRunMonitor(getApiKey, args),
  );

  server.registerTool(
    "list_monitor_alerts",
    {
      title: "List Monitor Alerts",
      description: `List recent Monitoring alerts for one watchlist or the whole account. ${MONITORS_TOOL_NOTE}`,
      inputSchema: {
        id: z
          .string()
          .optional()
          .describe("Monitor id. Omit to list alerts across all monitors"),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Maximum number of alerts to return"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => handleListMonitorAlerts(getApiKey, args),
  );
}
