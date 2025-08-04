import { CarsXEInternationalVinDecoderResponse } from "../types/carsxe.js";

export function formatInternationalVinDecoderResponse(
  data: CarsXEInternationalVinDecoderResponse
): string {
  const a = data.attributes;
  return [
    `🌍 International VIN Decode`,
    `VIN: ${a.vin}`,
    `Make: ${a.make}`,
    `Model: ${a.model}`,
    `Year: ${a.year}`,
    `Product Type: ${a.product_type}`,
    `Body: ${a.body}`,
    `Series: ${a.series}`,
    `Fuel Type: ${a.fuel_type}`,
    `Gears: ${a.gears}`,
    `Emission Standard: ${a.emission_standard}`,
    `Manufacturer: ${a.manufacturer}`,
    `Manufacturer Address: ${a.manufacturer_address}`,
    `Plant Country: ${a.plant_country}`,
    `Engine Manufacturer: ${a.engine_manufacturer}`,
    `CO2 Emission (g/km): ${a.avg_co2_emission_g_km}`,
    `Axels: ${a.no_of_axels}`,
    `Doors: ${a.no_of_doors}`,
    `Seats: ${a.no_of_seats}`,
    `Rear Brakes: ${a.rear_brakes}`,
    `Steering: ${a.steering_type}`,
    `Rear Suspension: ${a.rear_suspension}`,
    `Front Suspension: ${a.front_suspension}`,
    `Wheel Size: ${a.wheel_size}`,
    `Wheelbase (mm): ${a.wheelbase_mm}`,
    `Height (mm): ${a.height_mm}`,
    `Length (mm): ${a.length_mm}`,
    `Width (mm): ${a.width_mm}`,
    `Track Front (mm): ${a.track_front_mm}`,
    `Track Rear (mm): ${a.track_rear_mm}`,
    `Max Speed (km/h): ${a.max_speed_kmh}`,
    `Trunk Capacity (L): ${a.min_trunk_capacity_liters} - ${a.max_trunk_capacity_liters}`,
    `Weight Empty (kg): ${a.weight_empty_kg}`,
    `Max Weight (kg): ${a.max_weight_kg}`,
    `Max Roof Load (kg): ${a.max_roof_load_kg}`,
    `Permitted Trailer Load (kg, no brakes): ${a.permitted_trailer_load_without_brakes_kg}`,
    `ABS: ${a.abs === "1" ? "Yes" : "No"}`,
    `Check Digit: ${a.check_digit}`,
    `Sequential Number: ${a.sequential_number}`,
    `Timestamp: ${data.timestamp}`,
  ]
    .filter(Boolean)
    .join("\n");
}
