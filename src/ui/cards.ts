import { z } from "zod";
import {
  CarsXEMarketValueResponse,
  CarsXERecallsResponse,
  CarsXESpecsResponse,
} from "../types/carsxe.js";

function emptyToUndef(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

function asMoney(
  value: unknown,
  preferredKeys: string[] = [],
): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of preferredKeys) {
      const found = asMoney(obj[key]);
      if (found) return found;
    }
    for (const nested of Object.values(obj)) {
      const found = asMoney(nested);
      if (found) return found;
    }
  }
  return undefined;
}

export const vehicleCardSchema = {
  vin: z.string().describe("17-character VIN from get_vehicle_specs"),
  year: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  style: z.string().optional(),
  engine: z.string().optional(),
  transmission: z.string().optional(),
  drivetrain: z.string().optional(),
  fuelType: z.string().optional(),
  cityMpg: z.string().optional(),
  highwayMpg: z.string().optional(),
  seating: z.string().optional(),
  msrp: z.string().optional(),
  madeIn: z.string().optional(),
};

export const marketValueCardSchema = {
  vin: z.string().describe("VIN from get_market_value"),
  year: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  series: z.string().optional(),
  style: z.string().optional(),
  state: z.string().optional(),
  msrp: z.string().optional(),
  retailExcellent: z.string().optional(),
  retailClean: z.string().optional(),
  retailAverage: z.string().optional(),
  retailRough: z.string().optional(),
  tradeInClean: z.string().optional(),
  tradeInAverage: z.string().optional(),
  tradeInRough: z.string().optional(),
};

export const recallItemSchema = z.object({
  date: z.string().optional(),
  nhtsaId: z.string().optional(),
  component: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  risk: z.string().optional(),
  status: z.string().optional(),
  stopSale: z.boolean().optional(),
  dontDrive: z.boolean().optional(),
  remedyAvailable: z.boolean().optional(),
  remedy: z.string().optional(),
});

export const recallsCardSchema = {
  vin: z.string().describe("VIN from get_vehicle_recalls"),
  year: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  hasRecalls: z.boolean(),
  recallCount: z.number(),
  recalls: z.array(recallItemSchema),
};

export type VehicleCard = z.infer<z.ZodObject<typeof vehicleCardSchema>>;
export type MarketValueCard = z.infer<z.ZodObject<typeof marketValueCardSchema>>;
export type RecallsCard = z.infer<z.ZodObject<typeof recallsCardSchema>>;

export function toVehicleCard(data: CarsXESpecsResponse): VehicleCard {
  const a = (data.attributes ?? {}) as Record<string, string | undefined>;
  return {
    vin: emptyToUndef(a.vin) ?? emptyToUndef(data.input?.vin) ?? "",
    year: emptyToUndef(a.year),
    make: emptyToUndef(a.make),
    model: emptyToUndef(a.model),
    trim: emptyToUndef(a.trim),
    style: emptyToUndef(a.style) ?? emptyToUndef(a.body),
    engine: emptyToUndef(a.engine),
    transmission: emptyToUndef(a.transmission),
    drivetrain: emptyToUndef(a.drivetrain),
    fuelType: emptyToUndef(a.fuel_type),
    cityMpg: emptyToUndef(a.city_mileage),
    highwayMpg: emptyToUndef(a.highway_mileage),
    seating: emptyToUndef(a.standard_seating) ?? emptyToUndef(a.no_of_seats),
    msrp: emptyToUndef(a.manufacturer_suggested_retail_price),
    madeIn: emptyToUndef(a.made_in) ?? emptyToUndef(a.plant_country),
  };
}

export function toMarketValueCard(
  data: CarsXEMarketValueResponse,
): MarketValueCard {
  return {
    vin: emptyToUndef(data.input?.vin) ?? "",
    year: emptyToUndef(data.model_year),
    make: emptyToUndef(data.make),
    model: emptyToUndef(data.model),
    series: emptyToUndef(data.series),
    style: emptyToUndef(data.style),
    state: emptyToUndef(data.state) ?? emptyToUndef(data.input?.state),
    msrp: emptyToUndef(data.msrp),
    retailExcellent: asMoney(data.retail_xclean, ["adjusted_whole_xclean"]),
    retailClean: asMoney(data.retail_clean, ["adjusted_whole_clean"]),
    retailAverage: asMoney(data.retail_avg, ["adjusted_whole_avg"]),
    retailRough: asMoney(data.retail_rough, ["adjusted_whole_rough"]),
    tradeInClean: asMoney(data.trade_in_clean, ["adjusted_whole_clean"]),
    tradeInAverage: asMoney(data.trade_in_avg, ["adjusted_whole_avg"]),
    tradeInRough: asMoney(data.trade_in_rough, ["adjusted_whole_rough"]),
  };
}

export function toRecallsCard(data: CarsXERecallsResponse): RecallsCard {
  const v = data.data ?? {};
  return {
    vin: emptyToUndef(v.vin) ?? emptyToUndef(data.input?.vin) ?? "",
    year: emptyToUndef(v.model_year),
    make: emptyToUndef(v.make),
    model: emptyToUndef(v.model),
    manufacturer: emptyToUndef(v.manufacturer),
    hasRecalls: Boolean(v.has_recalls),
    recallCount: v.recall_count ?? v.recalls?.length ?? 0,
    recalls: (v.recalls ?? []).map((recall) => ({
      date: emptyToUndef(recall.recall_date),
      nhtsaId: emptyToUndef(recall.nhtsa_id),
      component: emptyToUndef(recall.component),
      name: emptyToUndef(recall.recall_name),
      description: emptyToUndef(recall.recall_description),
      risk: emptyToUndef(recall.risk_description),
      status: emptyToUndef(recall.recall_status),
      stopSale:
        recall.stop_sale === null || recall.stop_sale === undefined
          ? undefined
          : Boolean(recall.stop_sale),
      dontDrive:
        recall.dont_drive === null || recall.dont_drive === undefined
          ? undefined
          : Boolean(recall.dont_drive),
      remedyAvailable:
        recall.remedy_available === null ||
        recall.remedy_available === undefined
          ? undefined
          : Boolean(recall.remedy_available),
      remedy: emptyToUndef(recall.recall_remedy),
    })),
  };
}

export const PREVIEW_VEHICLE_CARD: VehicleCard = {
  vin: "WBAFR7C57CC811956",
  year: "2012",
  make: "BMW",
  model: "550i",
  trim: "xDrive",
  style: "Sedan",
  engine: "4.4L V8 Twin Turbo",
  transmission: "8-speed automatic",
  drivetrain: "AWD",
  fuelType: "Gasoline",
  cityMpg: "15",
  highwayMpg: "22",
  seating: "5",
  msrp: "64400",
  madeIn: "Germany",
};

export const PREVIEW_MARKET_VALUE: MarketValueCard = {
  vin: "WBAFR7C57CC811956",
  year: "2012",
  make: "BMW",
  model: "550i",
  series: "5 Series",
  style: "Sedan",
  state: "CA",
  msrp: "64400",
  retailExcellent: "18400",
  retailClean: "16200",
  retailAverage: "13800",
  retailRough: "11100",
  tradeInClean: "14100",
  tradeInAverage: "11800",
  tradeInRough: "9200",
};

export const PREVIEW_RECALLS: RecallsCard = {
  vin: "1C4JJXR64PW696340",
  year: "2023",
  make: "Jeep",
  model: "Wrangler",
  manufacturer: "Stellantis",
  hasRecalls: true,
  recallCount: 2,
  recalls: [
    {
      date: "2024-03-12",
      nhtsaId: "24V-184",
      component: "Air Bags",
      name: "Passenger air bag inflator",
      description:
        "The passenger frontal air bag inflator may rupture during deployment, increasing the risk of injury.",
      risk: "Air bag rupture can cause metal fragments to strike occupants.",
      status: "Open",
      stopSale: false,
      dontDrive: false,
      remedyAvailable: true,
      remedy: "Dealers will replace the inflator free of charge.",
    },
    {
      date: "2023-11-02",
      nhtsaId: "23V-718",
      component: "Electrical System",
      name: "Rear camera image",
      description:
        "The rearview camera image may not display when the vehicle is shifted into reverse.",
      risk: "A blank camera display can increase the risk of a crash.",
      status: "Open",
      stopSale: false,
      dontDrive: false,
      remedyAvailable: true,
      remedy: "Dealers will update the camera software.",
    },
  ],
};
