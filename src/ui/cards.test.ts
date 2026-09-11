import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CarsXEMarketValueResponse,
  CarsXERecallsResponse,
  CarsXESpecsResponse,
} from "../types/carsxe.js";
import { toMarketValueCard, toRecallsCard, toVehicleCard } from "./cards.js";

describe("card extractors", () => {
  it("maps specs without leaking the API key", () => {
    const card = toVehicleCard({
      success: true,
      input: { key: "secret-api-key", vin: "WBAFR7C57CC811956" },
      attributes: {
        year: "2012",
        make: "BMW",
        model: "550i",
        trim: "xDrive",
        style: "Sedan",
        made_in: "Germany",
        engine: "4.4L V8",
        transmission: "Automatic",
        drivetrain: "AWD",
        city_mileage: "15",
        highway_mileage: "22",
        fuel_capacity: "18",
        overall_length: "",
        overall_width: "",
        overall_height: "",
        wheelbase_length: "",
        curb_weight: "",
        turning_diameter: "",
        standard_seating: "5",
        manufacturer_suggested_retail_price: "64400",
        invoice_price: "",
        delivery_charges: "",
        vin: "WBAFR7C57CC811956",
      },
      colors: [],
      equipment: {},
      warranties: [],
    } as CarsXESpecsResponse);

    assert.equal(card.vin, "WBAFR7C57CC811956");
    assert.equal(card.make, "BMW");
    assert.equal(card.engine, "4.4L V8");
    assert.equal(JSON.stringify(card).includes("secret-api-key"), false);
  });

  it("flattens market-value band objects", () => {
    const card = toMarketValueCard({
      input: { vin: "WBAFR7C57CC811956", state: "CA" },
      model_year: "2012",
      make: "BMW",
      model: "550i",
      msrp: "64400",
      retail_xclean: { adjusted_whole_xclean: 18400 },
      retail_clean: { adjusted_whole_clean: 16200 },
      retail_avg: { adjusted_whole_avg: 13800 },
      retail_rough: { adjusted_whole_rough: 11100 },
      trade_in_clean: { adjusted_whole_clean: 14100 },
      trade_in_avg: { adjusted_whole_avg: 11800 },
      trade_in_rough: { adjusted_whole_rough: 9200 },
    } as CarsXEMarketValueResponse);

    assert.equal(card.retailExcellent, "18400");
    assert.equal(card.tradeInRough, "9200");
    assert.equal(card.state, "CA");
  });

  it("maps recall records without the API key", () => {
    const card = toRecallsCard({
      success: true,
      input: { key: "secret-api-key", vin: "1C4JJXR64PW696340" },
      data: {
        vin: "1C4JJXR64PW696340",
        make: "Jeep",
        model: "Wrangler",
        model_year: "2023",
        has_recalls: true,
        recall_count: 1,
        recalls: [
          {
            nhtsa_id: "24V-184",
            component: "Air Bags",
            recall_description: "Inflator risk",
            dont_drive: false,
            stop_sale: true,
            remedy_available: true,
          },
        ],
      },
    } as CarsXERecallsResponse);

    assert.equal(card.hasRecalls, true);
    assert.equal(card.recalls[0]?.nhtsaId, "24V-184");
    assert.equal(card.recalls[0]?.stopSale, true);
    assert.equal(JSON.stringify(card).includes("secret-api-key"), false);
  });
});
