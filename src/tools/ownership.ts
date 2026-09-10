import { z } from "zod";
import { carsxeApiRequest } from "../utils/carsxeApi.js";
import type {
  CarsXEOwnershipAddressResponse,
  CarsXEOwnershipPersonResponse,
  CarsXEOwnershipVinResponse,
  CarsXEOwnershipZipResponse,
} from "../types/carsxe.js";
import {
  formatOwnershipAddressResponse,
  formatOwnershipPersonResponse,
  formatOwnershipVinResponse,
  formatOwnershipZipResponse,
} from "../formatters/carsxe.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const INCLUDE_HELP =
  "Comma-separated subset of demographics,emails,phones,vehicle_history. Omit to return everything.";

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

function optionalParams(
  values: Record<string, string | number | undefined>,
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params[key] = String(value);
  }
  return params;
}

export function registerOwnershipTools(
  server: McpServer,
  getApiKey: () => string | null,
) {
  server.registerTool(
    "get_ownership_by_vin",
    {
      title: "Get Ownership by VIN",
      description:
        "Enterprise: look up registered owner(s) for a VIN, including contact info and vehicle history",
      inputSchema: {
        vin: z
          .string()
          .min(17)
          .max(17)
          .describe("17-character Vehicle Identification Number"),
        include: z.string().optional().describe(INCLUDE_HELP),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ vin, include }) => {
      const apiKey = getApiKey();
      if (!apiKey) return missingKey();
      const data = await carsxeApiRequest<CarsXEOwnershipVinResponse>(
        "v1/ownership/vin",
        optionalParams({ vin, include }),
        apiKey,
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Ownership lookup failed. This API is Enterprise-only; a 404 no_data response means no match and is not billed.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatOwnershipVinResponse(data),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_ownership_by_person",
    {
      title: "Get Ownership by Person",
      description:
        "Enterprise: look up contact details and linked vehicles for a name + street address + ZIP",
      inputSchema: {
        firstName: z
          .string()
          .max(50)
          .describe("First name (max 50 characters)"),
        lastName: z.string().max(50).describe("Last name (max 50 characters)"),
        address: z
          .string()
          .max(100)
          .describe("Street address only, no city/state (max 100 characters)"),
        zip: z.string().describe("5-digit US ZIP, optionally ZIP+4"),
        include: z.string().optional().describe(INCLUDE_HELP),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ firstName, lastName, address, zip, include }) => {
      const apiKey = getApiKey();
      if (!apiKey) return missingKey();
      const data = await carsxeApiRequest<CarsXEOwnershipPersonResponse>(
        "v1/ownership/person",
        optionalParams({
          first_name: firstName,
          last_name: lastName,
          address,
          zip,
          include,
        }),
        apiKey,
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Ownership lookup failed. This API is Enterprise-only; a 404 no_data response means no match and is not billed.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatOwnershipPersonResponse(data),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_ownership_by_address",
    {
      title: "Get Ownership by Address",
      description:
        "Enterprise: look up residents at a street address + ZIP, with contact info and vehicle history",
      inputSchema: {
        address: z
          .string()
          .max(100)
          .describe("Street address only, no city/state (max 100 characters)"),
        zip: z.string().describe("5-digit US ZIP, optionally ZIP+4"),
        include: z.string().optional().describe(INCLUDE_HELP),
        variant: z
          .string()
          .optional()
          .describe(
            "Legacy alias (vehicle_history or compliance). Prefer include.",
          ),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ address, zip, include, variant }) => {
      const apiKey = getApiKey();
      if (!apiKey) return missingKey();
      const data = await carsxeApiRequest<CarsXEOwnershipAddressResponse>(
        "v1/ownership/address",
        optionalParams({ address, zip, include, variant }),
        apiKey,
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Ownership lookup failed. This API is Enterprise-only; a 404 no_data response means no match and is not billed.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatOwnershipAddressResponse(data),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_ownership_by_zip",
    {
      title: "Get Ownership by ZIP",
      description:
        "Enterprise: search people in a 5-digit ZIP with optional gender, age, and income filters. Billed per record returned (default page size 15, max 100).",
      inputSchema: {
        zip: z.string().describe("Exactly 5-digit US ZIP"),
        gender: z.string().optional().describe("M or F"),
        minAge: z.number().int().optional().describe("Minimum age (whole number)"),
        maxAge: z.number().int().optional().describe("Maximum age (whole number)"),
        income: z
          .string()
          .optional()
          .describe("Income code or label (e.g. F, K, $50,000–$59,999)"),
        page: z.number().int().min(1).optional().describe("Page number (default 1)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Page size (default 15, max 100)"),
        include: z.string().optional().describe(INCLUDE_HELP),
        variant: z
          .string()
          .optional()
          .describe("Legacy alias (vehicle_history). Prefer include."),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({
      zip,
      gender,
      minAge,
      maxAge,
      income,
      page,
      limit,
      include,
      variant,
    }) => {
      const apiKey = getApiKey();
      if (!apiKey) return missingKey();
      const data = await carsxeApiRequest<CarsXEOwnershipZipResponse>(
        "v1/ownership/zip",
        optionalParams({
          zip,
          gender,
          min_age: minAge,
          max_age: maxAge,
          income,
          page,
          limit,
          include,
          variant,
        }),
        apiKey,
      );
      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Ownership lookup failed. This API is Enterprise-only; ZIP pages are billed per record returned.",
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: formatOwnershipZipResponse(data),
          },
        ],
      };
    },
  );
}
