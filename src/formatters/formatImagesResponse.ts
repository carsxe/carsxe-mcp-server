import { CarsXEImagesResponse } from "../types/carsxe.js";

export function formatImagesResponse(data: CarsXEImagesResponse): string {
  if (!data.success) {
    return `❌ Failed to retrieve images. ${data.error || ""}`;
  }
  if (!data.images?.length) {
    return "No images found for the specified vehicle.";
  }
  const lines = [
    "### 🖼️ Vehicle Images",
    data.query
      ? `**Query:** ${Object.entries(data.query)
          .map(([k, v]) => `\`${k}\`: ${v}`)
          .join(", ")}`
      : "",
    "",
    ...data.images
      .slice(0, 5)
      .map((img, i) =>
        [
          `**Image ${i + 1}:**`,
          `- [Full Image Link](${img.link})`,
          img.thumbnailLink ? `- [Thumbnail](${img.thumbnailLink})` : null,
          img.contextLink ? `- [Source Page](${img.contextLink})` : null,
          img.mime ? `- **Type:** ${img.mime}` : null,
          img.width && img.height
            ? `- **Dimensions:** ${img.width}×${img.height}`
            : null,
          img.byteSize ? `- **Size:** ${img.byteSize} bytes` : null,
          img.accentColor ? `- **Accent Color:** #${img.accentColor}` : null,
          img.datePublished
            ? `- **Published:** ${img.datePublished.split("T")[0]}`
            : null,
        ]
          .filter(Boolean)
          .join("\n")
      ),
    data.images.length > 5
      ? `...and ${data.images.length - 5} more images.`
      : "",
  ];
  return lines.filter(Boolean).join("\n\n");
}
