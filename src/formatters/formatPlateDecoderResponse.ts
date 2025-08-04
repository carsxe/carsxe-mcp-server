import { CarsXEPlateDecoderResponse } from "../types/carsxe.js";

export function formatPlateDecoderResponse(
  data: CarsXEPlateDecoderResponse
): string {
  const {
    year,
    make,
    model,
    trim,
    vin,
    style,
    assembly,
    fuel_type,
    color,
    body_style,
    engine_size,
    drive_type,
    transmission,
    description,
  } = data;
  return [
    `🚗 ${year} ${make} ${model} ${trim}`,
    `VIN: ${vin}`,
    `Style: ${style}`,
    `Body: ${body_style}`,
    `Color: ${color}`,
    `Engine: ${engine_size}`,
    `Fuel: ${fuel_type}`,
    `Drive: ${drive_type}`,
    `Transmission: ${transmission}`,
    `Assembly: ${assembly}`,
    `Description: ${description}`,
  ]
    .filter(Boolean)
    .join("\n");
}
