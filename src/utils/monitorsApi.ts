export const MONITORS_DOCS_URL = "https://docs.carsxe.com/docs";

export const MISSING_API_KEY_MESSAGE =
  "❌ API key not provided. Please ensure X-API-Key header is set.";

export type MonitorVehicleType = "vin" | "plate";

export interface MonitorScheduleInput {
  frequency: string;
  timezone?: string;
}

export interface CreateMonitorInput {
  name: string;
  vehicleType: MonitorVehicleType;
  vehicles: string[];
  products: string[];
  schedule: MonitorScheduleInput;
  delivery: string[];
}

export interface UpdateMonitorInput {
  name?: string;
  vehicleType?: MonitorVehicleType;
  vehicles?: string[];
  products?: string[];
  schedule?: MonitorScheduleInput;
  delivery?: string[];
  paused?: boolean;
}

export interface ImportMonitorInput {
  vehicles?: string[];
  csv?: string;
}

function omitUndefined(
  body: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

export function monitorCollectionPath(): string {
  return "v1/monitors";
}

export function monitorItemPath(id: string): string {
  return `v1/monitors/${encodeURIComponent(id)}`;
}

export function monitorImportPath(id: string): string {
  return `${monitorItemPath(id)}/import`;
}

export function monitorRunPath(id: string): string {
  return `${monitorItemPath(id)}/run`;
}

export function monitorAlertsPath(id?: string): string {
  return id ? `${monitorItemPath(id)}/alerts` : "v1/monitors/alerts";
}

export function buildCreateMonitorBody(
  input: CreateMonitorInput,
): Record<string, unknown> {
  const body = omitUndefined({
    name: input.name,
    vehicleType: input.vehicleType,
    vehicles: input.vehicles,
    products: input.products,
    schedule: omitUndefined({
      frequency: input.schedule.frequency,
      timezone: input.schedule.timezone,
    }),
    delivery: input.delivery,
  });
  if (!body) {
    throw new Error("Create monitor body is empty");
  }
  return body;
}

export function buildUpdateMonitorBody(
  input: UpdateMonitorInput,
): Record<string, unknown> | undefined {
  const schedule = input.schedule
    ? omitUndefined({
        frequency: input.schedule.frequency,
        timezone: input.schedule.timezone,
      })
    : undefined;
  return omitUndefined({
    name: input.name,
    vehicleType: input.vehicleType,
    vehicles: input.vehicles,
    products: input.products,
    schedule,
    delivery: input.delivery,
    paused: input.paused,
  });
}

export function buildImportMonitorBody(
  input: ImportMonitorInput,
): Record<string, unknown> | undefined {
  return omitUndefined({
    vehicles: input.vehicles,
    csv: input.csv,
  });
}
