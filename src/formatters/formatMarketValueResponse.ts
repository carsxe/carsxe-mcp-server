import { CarsXEMarketValueResponse } from "../types/carsxe.js";

export function formatMarketValueResponse(
  data: CarsXEMarketValueResponse
): string {
  // Helper to show value or fallback to JSON string for debugging
  function showValue(obj: any, key: string): string {
    if (!obj) return "N/A";
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    // fallback: show first property if exists
    const firstKey =
      obj && typeof obj === "object" ? Object.keys(obj)[0] : undefined;
    if (firstKey && obj[firstKey] !== undefined) return obj[firstKey];
    // fallback: show JSON
    return JSON.stringify(obj);
  }
  return [
    `💲 Vehicle Market Value`,
    `VIN: ${data.input?.vin}`,
    `Make: ${data.make}`,
    `Model: ${data.model}`,
    `Year: ${data.model_year}`,
    `Series: ${data.series}`,
    `Style: ${data.style}`,
    `Class: ${data.class_name}`,
    `State: ${data.state}`,
    `Country: ${data.country}`,
    `Publish Date: ${data.publish_date}`,
    `Data Frequency: ${data.data_freq}`,
    ``,
    `Retail (Excellent): ${showValue(
      data.retail_xclean,
      "adjusted_whole_xclean"
    )}`,
    `Retail (Good): ${showValue(data.retail_clean, "adjusted_whole_clean")}`,
    `Retail (Average): ${showValue(data.retail_avg, "adjusted_whole_avg")}`,
    `Retail (Rough): ${showValue(data.retail_rough, "adjusted_whole_rough")}`,
    ``,
    `Trade-In (Good): ${showValue(
      data.trade_in_clean,
      "adjusted_whole_clean"
    )}`,
    `Trade-In (Average): ${showValue(data.trade_in_avg, "adjusted_whole_avg")}`,
    `Trade-In (Rough): ${showValue(
      data.trade_in_rough,
      "adjusted_whole_rough"
    )}`,
    ``,
    `MSRP: ${data.msrp}`,
    // Debug: print raw objects if values are missing
    data.retail_xclean && typeof data.retail_xclean === "object"
      ? `Raw retail_xclean: ${JSON.stringify(data.retail_xclean)}`
      : undefined,
    data.retail_clean && typeof data.retail_clean === "object"
      ? `Raw retail_clean: ${JSON.stringify(data.retail_clean)}`
      : undefined,
    data.retail_avg && typeof data.retail_avg === "object"
      ? `Raw retail_avg: ${JSON.stringify(data.retail_avg)}`
      : undefined,
    data.retail_rough && typeof data.retail_rough === "object"
      ? `Raw retail_rough: ${JSON.stringify(data.retail_rough)}`
      : undefined,
    data.trade_in_clean && typeof data.trade_in_clean === "object"
      ? `Raw trade_in_clean: ${JSON.stringify(data.trade_in_clean)}`
      : undefined,
    data.trade_in_avg && typeof data.trade_in_avg === "object"
      ? `Raw trade_in_avg: ${JSON.stringify(data.trade_in_avg)}`
      : undefined,
    data.trade_in_rough && typeof data.trade_in_rough === "object"
      ? `Raw trade_in_rough: ${JSON.stringify(data.trade_in_rough)}`
      : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}
