import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { previewHtml } from "./widgetHtml.js";

async function main() {
  const outDir = path.resolve(process.cwd(), "previews");
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "vehicle-card.html"),
    previewHtml("vehicle"),
  );
  await writeFile(
    path.join(outDir, "market-value.html"),
    previewHtml("marketValue"),
  );
  await writeFile(path.join(outDir, "recalls.html"), previewHtml("recalls"));
  console.log(`Wrote MCP Apps card previews to ${outDir}`);
}

void main();
