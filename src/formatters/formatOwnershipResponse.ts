import type {
  CarsXEOwnershipAddressResponse,
  CarsXEOwnershipPerson,
  CarsXEOwnershipPersonResponse,
  CarsXEOwnershipVinResponse,
  CarsXEOwnershipZipResponse,
} from "../types/carsxe.js";

function formatAddress(address?: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string {
  if (!address) return "";
  return [address.street, address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ");
}

function formatPerson(person: CarsXEOwnershipPerson, index: number): string {
  const lines = [
    `**${index + 1}. ${[person.first_name, person.last_name].filter(Boolean).join(" ") || "Unknown"}**`,
    person.record_id ? `- **Record ID:** ${person.record_id}` : null,
    person.age ? `- **Age:** ${person.age}` : null,
    person.gender ? `- **Gender:** ${person.gender}` : null,
    formatAddress(person.address)
      ? `- **Address:** ${formatAddress(person.address)}`
      : null,
    person.vin ? `- **VIN:** ${person.vin}` : null,
    person.vehicle
      ? `- **Vehicle:** ${[person.vehicle.year, person.vehicle.make, person.vehicle.model]
          .filter(Boolean)
          .join(" ")}`
      : null,
    person.first_observed
      ? `- **First Observed:** ${person.first_observed}`
      : null,
    person.last_observed ? `- **Last Observed:** ${person.last_observed}` : null,
    person.source_count !== undefined && person.source_count !== null
      ? `- **Source Count:** ${person.source_count}`
      : null,
  ].filter(Boolean) as string[];

  const demo = person.demographics;
  if (demo) {
    const demoLines = Object.entries(demo)
      .filter(([, v]) => v)
      .map(([k, v]) => `  - **${k.replaceAll("_", " ")}:** ${v}`);
    if (demoLines.length) {
      lines.push("- **Demographics:**", ...demoLines);
    }
  }

  if (person.emails?.length) {
    lines.push(
      "- **Emails:**",
      ...person.emails
        .filter((e) => e.address)
        .map((e) => `  - ${e.address}${e.last_seen ? ` (last seen ${e.last_seen})` : ""}`),
    );
  }

  if (person.phones?.length) {
    lines.push(
      "- **Phones:**",
      ...person.phones
        .filter((p) => p.number)
        .map((p) => {
          const bits = [p.number, p.type, p.dnc ? "DNC" : null].filter(Boolean);
          return `  - ${bits.join(" · ")}`;
        }),
    );
  }

  if (person.vehicle_history?.length) {
    lines.push(
      "- **Vehicle History:**",
      ...person.vehicle_history.map((v) => {
        const label = [v.year, v.make, v.model].filter(Boolean).join(" ");
        return `  - ${label || "Vehicle"}${v.vin ? ` (${v.vin})` : ""}`;
      }),
    );
  }

  return lines.join("\n");
}

function ownershipError(data: {
  success: boolean;
  error?: string;
  message?: string;
}): string | null {
  if (data.success) return null;
  if (data.error === "no_data") {
    return "✅ No ownership match found. Nothing was billed.";
  }
  if (data.error === "api_not_enabled") {
    return "❌ Ownership is an Enterprise API and is not enabled on this key.";
  }
  return `❌ Ownership lookup failed. ${data.message || data.error || "Unknown error."}`;
}

export function formatOwnershipVinResponse(
  data: CarsXEOwnershipVinResponse,
): string {
  const err = ownershipError(data);
  if (err) return err;
  const v = data.vehicle;
  const lines = [
    "### 👤 Ownership by VIN (Enterprise)",
    `**VIN:** ${data.vin || "N/A"}`,
    v
      ? `**Vehicle:** ${[v.year, v.make, v.model].filter(Boolean).join(" ")}`
      : null,
    v?.manufacturer ? `**Manufacturer:** ${v.manufacturer}` : null,
    v?.vehicle_type ? `**Type:** ${v.vehicle_type}` : null,
    "",
    `**Owners:** ${data.owners?.length || 0} (billed per record)`,
    "",
    ...(data.owners ?? []).map((owner, i) => formatPerson(owner, i)),
  ];
  return lines.filter((line) => line !== null).join("\n");
}

export function formatOwnershipPersonResponse(
  data: CarsXEOwnershipPersonResponse,
): string {
  const err = ownershipError(data);
  if (err) return err;
  const matches = data.matches ?? [];
  const lines = [
    "### 👤 Ownership by Person (Enterprise)",
    data.input
      ? `**Query:** ${[data.input.first_name, data.input.last_name, data.input.address, data.input.zip]
          .filter(Boolean)
          .join(" · ")}`
      : null,
    `**Matches:** ${data.count ?? matches.length} (billed per record)`,
    "",
    ...matches.map((person, i) => formatPerson(person, i)),
  ];
  return lines.filter((line) => line !== null).join("\n");
}

export function formatOwnershipAddressResponse(
  data: CarsXEOwnershipAddressResponse,
): string {
  const err = ownershipError(data);
  if (err) return err;
  const matches = data.matches ?? [];
  const lines = [
    "### 👤 Ownership by Address (Enterprise)",
    data.input
      ? `**Query:** ${[data.input.address, data.input.zip].filter(Boolean).join(" · ")}`
      : null,
    `**Residents:** ${data.count ?? matches.length} (billed per record)`,
    "",
    ...matches.map((person, i) => formatPerson(person, i)),
  ];
  return lines.filter((line) => line !== null).join("\n");
}

export function formatOwnershipZipResponse(
  data: CarsXEOwnershipZipResponse,
): string {
  const err = ownershipError(data);
  if (err) return err;
  const records = data.records ?? [];
  const filterBits = data.filters
    ? Object.entries(data.filters)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")
    : "";
  const lines = [
    "### 👤 Ownership by ZIP (Enterprise)",
    `**ZIP:** ${data.zip || "N/A"}`,
    filterBits ? `**Filters:** ${filterBits}` : null,
    `**Page:** ${data.page ?? 1} · **Limit:** ${data.limit ?? records.length}`,
    `**Records on this page:** ${data.count ?? records.length} (billed per record)`,
    "",
    ...records.map((person, i) => formatPerson(person, i)),
  ];
  return lines.filter((line) => line !== null).join("\n");
}
