import type {
  CarsXEMonitor,
  CarsXEMonitorAlert,
  CarsXEMonitorsResponse,
} from "../types/carsxe.js";
import { MONITORS_DOCS_URL } from "../utils/monitorsApi.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asMonitor(value: unknown): CarsXEMonitor | undefined {
  return isRecord(value) ? (value as CarsXEMonitor) : undefined;
}

function asMonitorList(value: unknown): CarsXEMonitor[] | undefined {
  if (Array.isArray(value)) return value as CarsXEMonitor[];
  if (isRecord(value) && Array.isArray(value.monitors)) {
    return value.monitors as CarsXEMonitor[];
  }
  return undefined;
}

function asAlertList(value: unknown): CarsXEMonitorAlert[] | undefined {
  if (Array.isArray(value)) return value as CarsXEMonitorAlert[];
  if (isRecord(value) && Array.isArray(value.alerts)) {
    return value.alerts as CarsXEMonitorAlert[];
  }
  return undefined;
}

export function unwrapMonitor(
  data: CarsXEMonitorsResponse,
): CarsXEMonitor | undefined {
  if (data.monitor) return data.monitor;
  const nested = asMonitor(data.data);
  if (nested && !Array.isArray(data.data)) {
    if (nested.id || nested.name || nested.vehicles || nested.products) {
      return nested;
    }
    if (isRecord(data.data) && data.data.monitor) {
      return asMonitor(data.data.monitor);
    }
  }
  const list = unwrapMonitors(data);
  return list.length === 1 ? list[0] : undefined;
}

export function unwrapMonitors(data: CarsXEMonitorsResponse): CarsXEMonitor[] {
  if (Array.isArray(data.monitors)) return data.monitors;
  const fromData = asMonitorList(data.data);
  if (fromData) return fromData;
  if (data.monitor) return [data.monitor];
  return [];
}

export function unwrapAlerts(data: CarsXEMonitorsResponse): CarsXEMonitorAlert[] {
  if (Array.isArray(data.alerts)) return data.alerts;
  const fromData = asAlertList(data.data);
  if (fromData) return fromData;
  return [];
}

function statusLabel(monitor: CarsXEMonitor): string {
  if (typeof monitor.paused === "boolean") {
    return monitor.paused ? "Paused" : "Active";
  }
  if (monitor.status) return String(monitor.status);
  return "Unknown";
}

function joinList(values: unknown): string {
  if (!Array.isArray(values) || values.length === 0) return "—";
  return values.map((value) => String(value)).join(", ");
}

function scheduleLabel(schedule: CarsXEMonitor["schedule"]): string {
  if (!schedule || typeof schedule !== "object") return "—";
  const frequency = schedule.frequency ? String(schedule.frequency) : "—";
  return schedule.timezone
    ? `${frequency} (${schedule.timezone})`
    : frequency;
}

function monitorId(monitor: CarsXEMonitor): string {
  return monitor.id ? String(monitor.id) : "unknown";
}

function formatVehiclePreview(monitor: CarsXEMonitor, limit = 8): string {
  const vehicles = Array.isArray(monitor.vehicles) ? monitor.vehicles : [];
  const count =
    typeof monitor.vehicleCount === "number"
      ? monitor.vehicleCount
      : vehicles.length;
  if (vehicles.length === 0) {
    return count ? `${count} vehicle(s)` : "—";
  }
  const shown = vehicles.slice(0, limit).map((v) => `\`${v}\``);
  const extra = count > shown.length ? ` (+${count - shown.length} more)` : "";
  return `${shown.join(", ")}${extra}`;
}

function docsLine(): string {
  return `Docs: ${MONITORS_DOCS_URL}`;
}

export function formatMonitorError(message: string): string {
  return [`❌ ${message}`, "", docsLine()].join("\n");
}

export function formatMonitorList(data: CarsXEMonitorsResponse): string {
  const monitors = unwrapMonitors(data);
  if (monitors.length === 0) {
    return [
      "### 📡 Monitors",
      "",
      "No monitors found. Create one with `create_monitor`.",
      "",
      docsLine(),
    ].join("\n");
  }

  const lines = [
    `### 📡 Monitors (${monitors.length})`,
    "",
    ...monitors.flatMap((monitor) => [
      `**${monitor.name || "Untitled"}** (\`${monitorId(monitor)}\`)`,
      `- **Status:** ${statusLabel(monitor)}`,
      `- **Type:** ${monitor.vehicleType || "—"}`,
      `- **Vehicles:** ${formatVehiclePreview(monitor, 3)}`,
      `- **Products:** ${joinList(monitor.products)}`,
      `- **Schedule:** ${scheduleLabel(monitor.schedule)}`,
      `- **Delivery:** ${joinList(monitor.delivery)}`,
      "",
    ]),
    docsLine(),
  ];
  return lines.join("\n");
}

export function formatMonitorDetail(
  data: CarsXEMonitorsResponse,
  fallbackId?: string,
): string {
  const monitor = unwrapMonitor(data);
  if (!monitor) {
    return formatMonitorError(
      fallbackId
        ? `Monitor \`${fallbackId}\` was not found in the response.`
        : "Monitor was not found in the response.",
    );
  }

  const vehicles = Array.isArray(monitor.vehicles) ? monitor.vehicles : [];
  const lines = [
    `### 📡 Monitor: ${monitor.name || "Untitled"}`,
    "",
    `**ID:** \`${monitorId(monitor)}\``,
    `**Status:** ${statusLabel(monitor)}`,
    `**Vehicle type:** ${monitor.vehicleType || "—"}`,
    `**Products:** ${joinList(monitor.products)}`,
    `**Schedule:** ${scheduleLabel(monitor.schedule)}`,
    `**Delivery:** ${joinList(monitor.delivery)}`,
    monitor.createdAt ? `**Created:** ${monitor.createdAt}` : null,
    monitor.updatedAt ? `**Updated:** ${monitor.updatedAt}` : null,
    monitor.lastRunAt ? `**Last run:** ${monitor.lastRunAt}` : null,
    monitor.nextRunAt ? `**Next run:** ${monitor.nextRunAt}` : null,
    "",
    `**Vehicles (${vehicles.length || monitor.vehicleCount || 0}):**`,
    vehicles.length
      ? vehicles.map((vehicle) => `- \`${vehicle}\``).join("\n")
      : "- —",
    "",
    docsLine(),
  ];
  return lines.filter((line) => line !== null).join("\n");
}

export function formatMonitorDeleted(id: string): string {
  return [
    "### 📡 Monitor deleted",
    "",
    `Monitor \`${id}\` was deleted.`,
    "",
    docsLine(),
  ].join("\n");
}

export function formatMonitorImport(
  data: CarsXEMonitorsResponse,
  id: string,
): string {
  const nested = isRecord(data.data) ? data.data : {};
  const imported =
    data.imported ?? nested.imported ?? nested.added ?? data.added;
  const skipped = data.skipped ?? nested.skipped;
  const lines = [
    "### 📡 Vehicles imported",
    "",
    `**Monitor:** \`${id}\``,
    imported !== undefined ? `**Imported:** ${imported}` : "**Imported:** yes",
    skipped !== undefined ? `**Skipped:** ${skipped}` : null,
    data.message ? `**Message:** ${data.message}` : null,
    "",
    docsLine(),
  ];
  return lines.filter((line) => line !== null).join("\n");
}

export function formatMonitorRun(
  data: CarsXEMonitorsResponse,
  id: string,
): string {
  const nested = isRecord(data.data) ? data.data : {};
  const runId = data.runId ?? nested.runId;
  const status = data.status ?? nested.status;
  const lines = [
    "### 📡 Monitor run started",
    "",
    `**Monitor:** \`${id}\``,
    runId ? `**Run ID:** \`${runId}\`` : null,
    status ? `**Status:** ${status}` : "**Status:** queued",
    data.message ? `**Message:** ${data.message}` : null,
    "",
    docsLine(),
  ];
  return lines.filter((line) => line !== null).join("\n");
}

export function formatMonitorAlerts(
  data: CarsXEMonitorsResponse,
  monitorId?: string,
): string {
  const alerts = unwrapAlerts(data);
  const heading = monitorId
    ? `### 🔔 Alerts for monitor \`${monitorId}\``
    : "### 🔔 Monitor alerts";

  if (alerts.length === 0) {
    return [heading, "", "No alerts found.", "", docsLine()].join("\n");
  }

  const lines = [
    `${heading} (${alerts.length})`,
    "",
    ...alerts.map((alert, index) => {
      const when = alert.createdAt || alert.timestamp || "Unknown time";
      const vehicle = alert.vehicle || alert.vin || alert.plate;
      const title = alert.title || alert.summary || alert.message || "Alert";
      const detail = [alert.summary, alert.message].filter(
        (value, i, arr) => value && arr.indexOf(value) === i && value !== title,
      );
      return [
        `**${index + 1}. ${title}**`,
        `- **When:** ${when}`,
        vehicle ? `- **Vehicle:** \`${vehicle}\`` : null,
        alert.product ? `- **Product:** ${alert.product}` : null,
        alert.monitorId && !monitorId
          ? `- **Monitor:** \`${alert.monitorId}\``
          : null,
        alert.monitorName ? `- **Monitor name:** ${alert.monitorName}` : null,
        ...detail.map((value) => `- ${value}`),
        "",
      ]
        .filter(Boolean)
        .join("\n");
    }),
    docsLine(),
  ];
  return lines.join("\n");
}
