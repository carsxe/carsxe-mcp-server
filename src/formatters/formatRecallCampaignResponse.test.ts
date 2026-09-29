import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatRecallCampaignResponse } from "./formatRecallCampaignResponse.js";

describe("formatRecallCampaignResponse", () => {
  it("renders a matched campaign with lists split on semicolons", () => {
    const text = formatRecallCampaignResponse({
      success: true,
      input: { make: "volkswagen", code: "37M2" },
      data: {
        campaign_code: "37M2",
        recall_class: "Safety / Compliance Recall",
        description: "Shift lever micro switch may let the key be removed outside Park.",
        nhtsa_campaign_number: "19V615000",
        component: "ELECTRICAL SYSTEM:IGNITION:ANTI-THEFT:CONTROL MODULE",
        models: "BEETLE;GOLF;GTI;JETTA",
        model_years: "2011;2012;2019",
        confidence: "high",
        matched: true,
        dictionary_version: 1,
      },
      timestamp: "2026-09-25T12:29:09.352Z",
    });

    assert.match(text, /\*\*Campaign Code:\*\* 37M2/);
    assert.match(text, /\*\*NHTSA Campaign:\*\* 19V615000/);
    assert.match(text, /\*\*Models:\*\* BEETLE, GOLF, GTI, JETTA/);
    assert.match(text, /\*\*Model Years:\*\* 2011, 2012, 2019/);
    assert.doesNotMatch(text, /bulletin text/);
  });

  it("flags a prose-reference match", () => {
    const text = formatRecallCampaignResponse({
      success: true,
      input: { make: "volkswagen", code: "24TT" },
      data: { campaign_code: "24TT", confidence: "medium (prose reference)", matched: true },
    });
    assert.match(text, /matched from bulletin text/);
  });

  it("shows the API message for a code that is not found", () => {
    const text = formatRecallCampaignResponse({
      success: false,
      message: "No campaign found for this make and campaign code",
    });
    assert.equal(text, "❌ No campaign found for this make and campaign code");
  });
});
