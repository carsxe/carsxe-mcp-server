import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  CarsXEHistoryResponse,
  CarsXEImagesResponse,
  CarsXEInternationalVinDecoderResponse,
  CarsXELienTheftResponse,
  CarsXEObdCodeResponse,
  CarsXERecallsBatchJob,
  CarsXERecallsResponse,
  CarsXETimestamp,
} from "../types/carsxe.js";
import { formatHistoryResponse } from "./formatHistoryResponse.js";
import { formatImagesResponse } from "./formatImagesResponse.js";
import { formatInternationalVinDecoderResponse } from "./formatInternationalVinDecoderResponse.js";
import { formatLienTheftResponse } from "./formatLienTheftResponse.js";
import { formatObdCodeResponse } from "./formatObdCodeResponse.js";
import { formatRecallsBatchStatusResponse } from "./formatRecallsBatchResponse.js";
import { formatRecallsResponse } from "./formatRecallsResponse.js";

const ISO = "2024-10-16T12:34:56.000Z";
const DATE = "2024-10-16";
const MS = Date.parse(ISO);
const SEC = Math.floor(MS / 1000);

const SHAPES: Array<{ name: string; value: unknown }> = [
  { name: "ISO string", value: ISO },
  { name: "date-only string", value: DATE },
  { name: "epoch milliseconds", value: MS },
  { name: "epoch seconds", value: SEC },
  { name: "numeric millisecond string", value: String(MS) },
  { name: "numeric second string", value: String(SEC) },
  { name: "Date instance", value: new Date(ISO) },
  { name: "Firestore seconds object", value: { seconds: SEC, nanoseconds: 0 } },
  { name: "Firestore _seconds object", value: { _seconds: SEC, _nanoseconds: 0 } },
  { name: "Mongo $date object", value: { $date: ISO } },
  { name: "toISOString Date-like", value: { toISOString: () => ISO } },
  { name: "toDate Date-like", value: { toDate: () => new Date(ISO) } },
  { name: "missing undefined", value: undefined },
  { name: "missing null", value: null },
  { name: "missing empty string", value: "" },
  { name: "invalid string", value: "not-a-date" },
  { name: "empty object", value: {} },
];

function asTimestamp(value: unknown): CarsXETimestamp | undefined {
  return value as CarsXETimestamp | undefined;
}

describe("timestamp .split/.toString audit", () => {
  for (const shape of SHAPES) {
    it(`get_vehicle_recalls handles ${shape.name}`, () => {
      const data: CarsXERecallsResponse = {
        success: true,
        input: { vin: "1C4JJXR64PW696340" },
        data: {
          vin: "1C4JJXR64PW696340",
          make: "Jeep",
          model: "Wrangler",
          model_year: "2023",
          has_recalls: false,
          recall_count: 0,
          recalls: [],
        },
        timestamp: asTimestamp(shape.value),
      };
      const text = formatRecallsResponse(data);
      assert.equal(typeof text, "string");
      if (
        shape.name === "ISO string" ||
        shape.name === "date-only string" ||
        shape.name === "epoch milliseconds"
      ) {
        assert.equal(text.includes(`**Report Generated:** ${DATE}`), true);
      }
    });

    it(`decode_obd_code handles ${shape.name}`, () => {
      const data: CarsXEObdCodeResponse = {
        success: true,
        code: "P0420",
        diagnosis: "Catalyst",
        date: asTimestamp(shape.value),
      };
      assert.equal(typeof formatObdCodeResponse(data), "string");
    });

    it(`get_vehicle_images handles ${shape.name}`, () => {
      const data: CarsXEImagesResponse = {
        success: true,
        images: [
          {
            mime: "image/jpeg",
            link: "https://example.com/car.jpg",
            datePublished: asTimestamp(shape.value),
          },
        ],
      };
      assert.equal(typeof formatImagesResponse(data), "string");
    });

    it(`get_vehicle_history handles ${shape.name}`, () => {
      const data: CarsXEHistoryResponse = {
        vin: "1C4JJXR64PW696340",
        success: true,
        junkAndSalvageInformation: [{ VehicleObtainedDate: shape.value }],
        currentTitleInformation: [{ TitleIssueDate: { Date: shape.value } }],
        historyInformation: [{ TitleIssueDate: { Date: shape.value } }],
      };
      assert.equal(typeof formatHistoryResponse(data), "string");
    });

    it(`check_lien_and_theft handles ${shape.name}`, () => {
      const data: CarsXELienTheftResponse = {
        success: true,
        input: { vin: "1C4JJXR64PW696340" },
        timestamp: asTimestamp(shape.value),
      };
      assert.equal(typeof formatLienTheftResponse(data), "string");
    });

    it(`decode_international_vin handles ${shape.name}`, () => {
      const data = {
        success: true,
        input: { vin: "WVWZZZ3CZWE123456" },
        attributes: {
          vin: "WVWZZZ3CZWE123456",
          make: "Volkswagen",
          model: "Golf",
          year: "2014",
        },
        timestamp: shape.value,
      } as CarsXEInternationalVinDecoderResponse;
      assert.equal(typeof formatInternationalVinDecoderResponse(data), "string");
    });

    it(`get_recalls_batch_status handles ${shape.name}`, () => {
      const job: CarsXERecallsBatchJob = {
        batchId: "batch-1",
        status: "completed",
        createdAt: asTimestamp(shape.value),
        updatedAt: asTimestamp(shape.value),
        completedAt: asTimestamp(shape.value),
      };
      assert.equal(
        typeof formatRecallsBatchStatusResponse({ success: true, data: job }),
        "string",
      );
    });
  }
});
