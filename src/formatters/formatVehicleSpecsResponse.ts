import { CarsXESpecsResponse } from "../types/carsxe.js";

/** Non-empty string from API (many fields use "" for missing). */
function hasVal(v?: string): boolean {
  return v != null && String(v).trim() !== "";
}

export function formatVehicleSpecsResponse(
  specsData: CarsXESpecsResponse,
): string {
  const { attributes, colors = [], equipment = {}, warranties = [] } = specsData;
  const a = attributes as Record<string, string | undefined>;
  const header = (text: string, emoji: string) =>
    `\n${emoji} ${text.toUpperCase()}\n${"═".repeat(text.length + 2)}`;
  const subHeader = (text: string) => `\n• ${text}`;
  const item = (text: string) => `  ◦ ${text}`;
  const bold = (text: string) => `**${text}**`;

  const formatDimension = (value?: string, unit?: string) => {
    if (!value) return "Unknown";
    return unit && !value.includes(unit) ? `${value} ${unit}` : value;
  };

  const styleOrBody = hasVal(a.style) ? a.style! : hasVal(a.body) ? a.body! : "";
  const madeIn = hasVal(a.made_in)
    ? a.made_in!
    : hasVal(a.plant_country)
      ? a.plant_country!
      : "";

  const basicLines: string[] = [
    `🚗 ${bold(
      `${attributes.year} ${attributes.make} ${attributes.model} ${
        attributes.trim || ""
      }`.trim(),
    )}`,
  ];
  if (hasVal(a.vin)) basicLines.push(`${item(`${bold("VIN:")} ${a.vin}`)}`);
  if (hasVal(styleOrBody))
    basicLines.push(`${item(`${bold("Style / body:")} ${styleOrBody}`)}`);
  if (hasVal(a.series))
    basicLines.push(`${item(`${bold("Series:")} ${a.series}`)}`);
  if (hasVal(a.product_type))
    basicLines.push(`${item(`${bold("Product type:")} ${a.product_type}`)}`);
  if (hasVal(madeIn))
    basicLines.push(`${item(`${bold("Manufactured in:")} ${madeIn}`)}`);
  if (hasVal(a.manufacturer))
    basicLines.push(`${item(`${bold("Manufacturer:")} ${a.manufacturer}`)}`);
  if (hasVal(a.manufacturer_address))
    basicLines.push(
      `${item(`${bold("Manufacturer address:")} ${a.manufacturer_address}`)}`,
    );
  const basicInfo = basicLines.join("\n");

  const engineLines: string[] = [];
  const usEngine =
    hasVal(attributes.engine) ||
    hasVal(attributes.transmission) ||
    hasVal(attributes.drivetrain);
  const euEngine =
    hasVal(a.fuel_type) ||
    hasVal(a.gears) ||
    hasVal(a.emission_standard) ||
    hasVal(a.engine_manufacturer);

  if (usEngine || euEngine) {
    engineLines.push(`${subHeader("Powertrain")}`);
    if (hasVal(attributes.engine))
      engineLines.push(`${item(`${bold("Engine:")} ${attributes.engine}`)}`);
    if (hasVal(a.fuel_type))
      engineLines.push(`${item(`${bold("Fuel type:")} ${a.fuel_type}`)}`);
    if (hasVal(a.engine_manufacturer))
      engineLines.push(
        `${item(`${bold("Engine manufacturer:")} ${a.engine_manufacturer}`)}`,
      );
    if (hasVal(attributes.transmission))
      engineLines.push(
        `${item(`${bold("Transmission:")} ${attributes.transmission}`)}`,
      );
    if (hasVal(a.gears))
      engineLines.push(`${item(`${bold("Gears:")} ${a.gears}`)}`);
    if (hasVal(attributes.drivetrain))
      engineLines.push(
        `${item(`${bold("Drivetrain:")} ${attributes.drivetrain}`)}`,
      );
    if (hasVal(a.emission_standard))
      engineLines.push(
        `${item(`${bold("Emission standard:")} ${a.emission_standard}`)}`,
      );
  }

  const hasUsMpg =
    hasVal(attributes.city_mileage) ||
    hasVal(attributes.highway_mileage) ||
    hasVal(attributes.fuel_capacity);

  if (hasUsMpg) {
    engineLines.push(``);
    engineLines.push(`${subHeader("Fuel economy (US)")}`);
    engineLines.push(
      `${item(
        `${bold("City:")} ${formatDimension(
          attributes.city_mileage,
          "miles/gallon",
        )}`,
      )}`,
    );
    engineLines.push(
      `${item(
        `${bold("Highway:")} ${formatDimension(
          attributes.highway_mileage,
          "miles/gallon",
        )}`,
      )}`,
    );
    engineLines.push(
      `${item(
        `${bold("Fuel capacity:")} ${formatDimension(
          attributes.fuel_capacity,
          "gallon",
        )}`,
      )}`,
    );
  }

  if (hasVal(a.avg_co2_emission_g_km) && !hasUsMpg) {
    engineLines.push(``);
    engineLines.push(`${subHeader("Emissions & efficiency")}`);
    engineLines.push(
      `${item(
        `${bold("Avg CO₂:")} ${formatDimension(
          a.avg_co2_emission_g_km,
          "g/km",
        )}`,
      )}`,
    );
  }

  const enginePerformance =
    engineLines.length > 0
      ? [header("ENGINE & PERFORMANCE", "⚙️"), ...engineLines].join("\n")
      : "";

  const usDims =
    hasVal(attributes.overall_length) ||
    hasVal(attributes.overall_width) ||
    hasVal(attributes.overall_height) ||
    hasVal(attributes.wheelbase_length);
  const euDims =
    hasVal(a.length_mm) ||
    hasVal(a.width_mm) ||
    hasVal(a.height_mm) ||
    hasVal(a.wheelbase_mm);

  const dimLines: string[] = [];
  if (usDims) {
    dimLines.push(`${subHeader("Exterior dimensions")}`);
    dimLines.push(
      `${item(
        `${bold("Length:")} ${formatDimension(
          attributes.overall_length,
          "inches",
        )}`,
      )}`,
    );
    dimLines.push(
      `${item(
        `${bold("Width:")} ${formatDimension(attributes.overall_width, "inches")}`,
      )}`,
    );
    dimLines.push(
      `${item(
        `${bold("Height:")} ${formatDimension(
          attributes.overall_height,
          "inches",
        )}`,
      )}`,
    );
    dimLines.push(
      `${item(
        `${bold("Wheelbase:")} ${formatDimension(
          attributes.wheelbase_length,
          "inches",
        )}`,
      )}`,
    );
    if (hasVal(attributes.turning_diameter))
      dimLines.push(
        `${item(
          `${bold("Turning diameter:")} ${formatDimension(
            attributes.turning_diameter,
            "inches",
          )}`,
        )}`,
      );
  }
  if (euDims) {
    if (usDims) dimLines.push(``);
    dimLines.push(`${subHeader("Exterior dimensions (metric)")}`);
    if (hasVal(a.length_mm))
      dimLines.push(
        `${item(`${bold("Length:")} ${formatDimension(a.length_mm, "mm")}`)}`,
      );
    if (hasVal(a.width_mm))
      dimLines.push(
        `${item(`${bold("Width:")} ${formatDimension(a.width_mm, "mm")}`)}`,
      );
    if (hasVal(a.height_mm))
      dimLines.push(
        `${item(`${bold("Height:")} ${formatDimension(a.height_mm, "mm")}`)}`,
      );
    if (hasVal(a.wheelbase_mm))
      dimLines.push(
        `${item(
          `${bold("Wheelbase:")} ${formatDimension(a.wheelbase_mm, "mm")}`,
        )}`,
      );
    if (hasVal(a.wheelbase_array_mm) && a.wheelbase_array_mm !== a.wheelbase_mm)
      dimLines.push(
        `${item(`${bold("Wheelbase (variants):")} ${a.wheelbase_array_mm}`)}`,
      );
    if (hasVal(a.track_front_mm))
      dimLines.push(
        `${item(
          `${bold("Track front:")} ${formatDimension(a.track_front_mm, "mm")}`,
        )}`,
      );
    if (hasVal(a.track_rear_mm))
      dimLines.push(
        `${item(
          `${bold("Track rear:")} ${formatDimension(a.track_rear_mm, "mm")}`,
        )}`,
      );
  }

  const weightLines: string[] = [];
  if (hasVal(attributes.curb_weight))
    weightLines.push(
      `${item(
        `${bold("Curb weight:")} ${formatDimension(attributes.curb_weight, "lbs")}`,
      )}`,
    );
  if (hasVal(a.weight_empty_kg))
    weightLines.push(
      `${item(
        `${bold("Weight (empty):")} ${formatDimension(a.weight_empty_kg, "kg")}`,
      )}`,
    );
  if (hasVal(a.max_weight_kg))
    weightLines.push(
      `${item(
        `${bold("Max weight:")} ${formatDimension(a.max_weight_kg, "kg")}`,
      )}`,
    );
  if (hasVal(a.max_roof_load_kg))
    weightLines.push(
      `${item(
        `${bold("Max roof load:")} ${formatDimension(a.max_roof_load_kg, "kg")}`,
      )}`,
    );
  if (hasVal(a.permitted_trailer_load_without_brakes_kg))
    weightLines.push(
      `${item(
        `${bold("Trailer load (no brakes):")} ${formatDimension(
          a.permitted_trailer_load_without_brakes_kg,
          "kg",
        )}`,
      )}`,
    );

  const capacityLines: string[] = [];
  if (hasVal(a.max_trunk_capacity_liters) || hasVal(a.min_trunk_capacity_liters)) {
    capacityLines.push(`${subHeader("Cargo")}`);
    if (hasVal(a.max_trunk_capacity_liters))
      capacityLines.push(
        `${item(
          `${bold("Trunk (max):")} ${formatDimension(
            a.max_trunk_capacity_liters,
            "L",
          )}`,
        )}`,
      );
    if (hasVal(a.min_trunk_capacity_liters))
      capacityLines.push(
        `${item(
          `${bold("Trunk (min):")} ${formatDimension(
            a.min_trunk_capacity_liters,
            "L",
          )}`,
        )}`,
      );
  }

  const perfExtra: string[] = [];
  if (hasVal(a.max_speed_kmh))
    perfExtra.push(
      `${item(
        `${bold("Max speed:")} ${formatDimension(a.max_speed_kmh, "km/h")}`,
      )}`,
    );
  if (hasVal(a.wheel_size))
    perfExtra.push(`${item(`${bold("Wheel / tire:")} ${a.wheel_size}`)}`);
  if (hasVal(a.wheel_size_array) && a.wheel_size_array !== a.wheel_size)
    perfExtra.push(
      `${item(`${bold("Wheel / tire (all):")} ${a.wheel_size_array}`)}`,
    );

  const chassisLines: string[] = [];
  const chassisBits = [
    [a.front_suspension, "Front suspension"],
    [a.rear_suspension, "Rear suspension"],
    [a.steering_type, "Steering"],
    [a.rear_brakes, "Rear brakes"],
    [a.abs, "ABS"],
  ] as const;
  for (const [val, label] of chassisBits) {
    if (hasVal(val))
      chassisLines.push(`${item(`${bold(`${label}:`)} ${val}`)}`);
  }

  const interiorContent: string[] = [];
  const seats = hasVal(attributes.standard_seating)
    ? attributes.standard_seating
    : hasVal(a.no_of_seats)
      ? a.no_of_seats
      : "";
  if (hasVal(seats))
    interiorContent.push(`${item(`${bold("Seating:")} ${seats}`)}`);
  if (hasVal(a.no_of_doors))
    interiorContent.push(`${item(`${bold("Doors:")} ${a.no_of_doors}`)}`);
  if (hasVal(a.no_of_axels))
    interiorContent.push(`${item(`${bold("Axles:")} ${a.no_of_axels}`)}`);
  if (hasVal(attributes.front_headroom))
    interiorContent.push(
      `${item(
        `${bold("Front headroom:")} ${formatDimension(
          attributes.front_headroom,
          "inches",
        )}`,
      )}`,
    );
  if (hasVal(attributes.rear_headroom))
    interiorContent.push(
      `${item(
        `${bold("Rear headroom:")} ${formatDimension(
          attributes.rear_headroom,
          "inches",
        )}`,
      )}`,
    );
  if (hasVal(attributes.front_shoulder_room))
    interiorContent.push(
      `${item(
        `${bold("Front shoulder room:")} ${formatDimension(
          attributes.front_shoulder_room,
          "inches",
        )}`,
      )}`,
    );
  if (hasVal(attributes.rear_shoulder_room))
    interiorContent.push(
      `${item(
        `${bold("Rear shoulder room:")} ${formatDimension(
          attributes.rear_shoulder_room,
          "inches",
        )}`,
      )}`,
    );

  const interiorBlock =
    interiorContent.length > 0
      ? [``, `${subHeader("Interior & seating")}`, ...interiorContent]
      : [];

  const idLines: string[] = [];
  if (hasVal(a.check_digit) || hasVal(a.sequential_number)) {
    idLines.push(`${subHeader("VIN details")}`);
    if (hasVal(a.check_digit))
      idLines.push(`${item(`${bold("Check digit:")} ${a.check_digit}`)}`);
    if (hasVal(a.sequential_number))
      idLines.push(
        `${item(`${bold("Sequential #:")} ${a.sequential_number}`)}`,
      );
  }

  const hasDimensionsBody =
    dimLines.length > 0 ||
    weightLines.length > 0 ||
    capacityLines.length > 0 ||
    perfExtra.length > 0 ||
    chassisLines.length > 0 ||
    interiorContent.length > 0 ||
    idLines.length > 0;

  const dimensionsParts = hasDimensionsBody
    ? [
    header("DIMENSIONS & CAPACITY", "📏"),
    ...dimLines,
    ...(weightLines.length ? [``, `${subHeader("Weight")}`, ...weightLines] : []),
    ...(capacityLines.length ? [``, ...capacityLines] : []),
    ...(perfExtra.length ? [``, `${subHeader("Wheels & performance")}`, ...perfExtra] : []),
    ...(chassisLines.length ? [``, `${subHeader("Chassis")}`, ...chassisLines] : []),
    ...interiorBlock,
    ...(idLines.length ? [``, ...idLines] : []),
  ]
    : [];
  const dimensions = dimensionsParts.join("\n");

  const colorInfo =
    colors.length > 0
      ? [
          header("COLOR OPTIONS", "🎨"),
          ...colors.reduce((acc: string[], color) => {
            const existing = acc.find((c) =>
              c.includes(`${bold(color.category)}:`),
            );
            if (existing) {
              const index = acc.indexOf(existing);
              acc[index] = existing.replace(/\n$/, "") + `, ${color.name}\n`;
            } else {
              acc.push(
                `${subHeader(`${bold(color.category)}:`)}\n  ${item(
                  color.name,
                )}`,
              );
            }
            return acc;
          }, []),
        ].join("\n")
      : "";

  const hasPricing =
    hasVal(attributes.manufacturer_suggested_retail_price) ||
    hasVal(attributes.invoice_price) ||
    hasVal(attributes.delivery_charges);

  const pricing = hasPricing
    ? [
        header("ORIGINAL PRICING", "💰"),
        `${item(
          `${bold("MSRP:")} ${
            attributes.manufacturer_suggested_retail_price || "Unknown"
          }`,
        )}`,
        `${item(
          `${bold("Invoice Price:")} ${attributes.invoice_price || "Unknown"}`,
        )}`,
        `${item(
          `${bold("Delivery Charges:")} ${attributes.delivery_charges || "Unknown"}`,
        )}`,
      ].join("\n")
    : "";

  const warrantyInfo =
    warranties.length > 0
      ? [
          header("WARRANTY COVERAGE", "🛡️"),
          ...warranties.map((w) => {
            const parts = [`${item(`${bold(w.type)}:`)}`];
            if (w.months) parts.push(`${String(w.months).replace(" month", "-month")}`);
            if (w.miles)
              parts.push(`/${String(w.miles).replace(" mile", ",000 miles")}`);
            return parts.join(" ");
          }),
        ].join("\n")
      : "";

  const equipmentStd = (
    equipment && typeof equipment === "object" ? Object.entries(equipment) : []
  )
    .filter(([_, value]) => value === "Std.")
    .map(
      ([key]) =>
        `${item(
          key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        )}`,
    );

  const equipmentInfo =
    equipmentStd.length > 0
      ? [header("STANDARD EQUIPMENT", "🔧"), ...equipmentStd].join("\n")
      : "";

  return [
    basicInfo,
    enginePerformance,
    dimensions,
    colorInfo,
    pricing,
    warrantyInfo,
    equipmentInfo,
  ]
    .filter(Boolean)
    .join("\n");
}
