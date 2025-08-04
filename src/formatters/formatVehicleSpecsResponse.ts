import { CarsXESpecsResponse } from "../types/carsxe.js";

export function formatVehicleSpecsResponse(
  specsData: CarsXESpecsResponse
): string {
  const { attributes, colors, equipment, warranties } = specsData;
  const header = (text: string, emoji: string) =>
    `\n${emoji} ${text.toUpperCase()}\n${"═".repeat(text.length + 2)}`;
  const subHeader = (text: string) => `\n• ${text}`;
  const item = (text: string) => `  ◦ ${text}`;
  const bold = (text: string) => `**${text}**`;

  const formatDimension = (value?: string, unit?: string) => {
    if (!value) return "Unknown";
    return unit && !value.includes(unit) ? `${value} ${unit}` : value;
  };

  const basicInfo = [
    `🚗 ${bold(
      `${attributes.year} ${attributes.make} ${attributes.model} ${
        attributes.trim || ""
      }`.trim()
    )}`,
    `${item(`${bold("Style:")} ${attributes.style || "Unknown"}`)}`,
    `${item(`${bold("Manufactured in:")} ${attributes.made_in || "Unknown"}`)}`,
  ].join("\n");

  const enginePerformance = [
    header("ENGINE & PERFORMANCE", "⚙️"),
    `${subHeader("Powertrain")}`,
    `${item(`${bold("Engine:")} ${attributes.engine || "Unknown"}`)}`,
    `${item(
      `${bold("Transmission:")} ${attributes.transmission || "Unknown"}`
    )}`,
    `${item(`${bold("Drivetrain:")} ${attributes.drivetrain || "Unknown"}`)}`,
    ``,
    `${subHeader("Fuel Economy")}`,
    `${item(
      `${bold("City:")} ${formatDimension(
        attributes.city_mileage,
        "miles/gallon"
      )}`
    )}`,
    `${item(
      `${bold("Highway:")} ${formatDimension(
        attributes.highway_mileage,
        "miles/gallon"
      )}`
    )}`,
    `${item(
      `${bold("Fuel Capacity:")} ${formatDimension(
        attributes.fuel_capacity,
        "gallon"
      )}`
    )}`,
  ].join("\n");

  const dimensions = [
    header("DIMENSIONS & CAPACITY", "📏"),
    `${subHeader("Exterior Dimensions")}`,
    `${item(
      `${bold("Length:")} ${formatDimension(
        attributes.overall_length,
        "inches"
      )}`
    )}`,
    `${item(
      `${bold("Width:")} ${formatDimension(attributes.overall_width, "inches")}`
    )}`,
    `${item(
      `${bold("Height:")} ${formatDimension(
        attributes.overall_height,
        "inches"
      )}`
    )}`,
    `${item(
      `${bold("Wheelbase:")} ${formatDimension(
        attributes.wheelbase_length,
        "inches"
      )}`
    )}`,
    `${item(
      `${bold("Turning Diameter:")} ${formatDimension(
        attributes.turning_diameter,
        "inches"
      )}`
    )}`,
    ...(attributes.curb_weight
      ? [
          `${item(
            `${bold("Curb Weight:")} ${formatDimension(
              attributes.curb_weight,
              "lbs"
            )}`
          )}`,
        ]
      : []),
    ``,
    `${subHeader("Interior Capacity")}`,
    `${item(
      `${bold("Seating:")} ${attributes.standard_seating || "Unknown"}`
    )}`,
    ...(attributes.front_headroom
      ? [
          `${item(
            `${bold("Front Headroom:")} ${formatDimension(
              attributes.front_headroom,
              "inches"
            )}`
          )}`,
        ]
      : []),
    ...(attributes.rear_headroom
      ? [
          `${item(
            `${bold("Rear Headroom:")} ${formatDimension(
              attributes.rear_headroom,
              "inches"
            )}`
          )}`,
        ]
      : []),
    ...(attributes.front_shoulder_room
      ? [
          `${item(
            `${bold("Front Shoulder Room:")} ${formatDimension(
              attributes.front_shoulder_room,
              "inches"
            )}`
          )}`,
        ]
      : []),
    ...(attributes.rear_shoulder_room
      ? [
          `${item(
            `${bold("Rear Shoulder Room:")} ${formatDimension(
              attributes.rear_shoulder_room,
              "inches"
            )}`
          )}`,
        ]
      : []),
  ].join("\n");

  const colorInfo =
    colors.length > 0
      ? [
          header("COLOR OPTIONS", "🎨"),
          ...colors.reduce((acc: string[], color) => {
            const existing = acc.find((c) =>
              c.includes(`${bold(color.category)}:`)
            );
            if (existing) {
              const index = acc.indexOf(existing);
              acc[index] = existing.replace(/\n$/, "") + `, ${color.name}\n`;
            } else {
              acc.push(
                `${subHeader(`${bold(color.category)}:`)}\n  ${item(
                  color.name
                )}`
              );
            }
            return acc;
          }, []),
        ].join("\n")
      : "";

  const pricing = [
    header("ORIGINAL PRICING", "💰"),
    `${item(
      `${bold("MSRP:")} ${
        attributes.manufacturer_suggested_retail_price || "Unknown"
      }`
    )}`,
    `${item(
      `${bold("Invoice Price:")} ${attributes.invoice_price || "Unknown"}`
    )}`,
    `${item(
      `${bold("Delivery Charges:")} ${attributes.delivery_charges || "Unknown"}`
    )}`,
  ].join("\n");

  const warrantyInfo =
    warranties.length > 0
      ? [
          header("WARRANTY COVERAGE", "🛡️"),
          ...warranties.map((w) => {
            const parts = [`${item(`${bold(w.type)}:`)}`];
            if (w.months) parts.push(`${w.months.replace(" month", "-month")}`);
            if (w.miles)
              parts.push(`/${w.miles.replace(" mile", ",000 miles")}`);
            return parts.join(" ");
          }),
        ].join("\n")
      : "";

  const equipmentInfo = [
    header("STANDARD EQUIPMENT", "🔧"),
    ...Object.entries(equipment)
      .filter(([_, value]) => value === "Std.")
      .map(
        ([key]) =>
          `${item(
            key
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          )}`
      ),
  ].join("\n");

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
