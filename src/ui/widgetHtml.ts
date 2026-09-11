import {
  MarketValueCard,
  PREVIEW_MARKET_VALUE,
  PREVIEW_RECALLS,
  PREVIEW_VEHICLE_CARD,
  RecallsCard,
  VehicleCard,
} from "./cards.js";

const SHARED_CSS = `
:root {
  --ink: #12202f;
  --muted: #5b6b7c;
  --line: #d7dee7;
  --bg: #f4f7fb;
  --card: #ffffff;
  --navy: #0b1f3a;
  --navy-2: #16345c;
  --accent: #1f8a8a;
  --accent-soft: #d7f1f0;
  --warn: #c2410c;
  --warn-soft: #ffedd5;
  --ok: #047857;
  --ok-soft: #d1fae5;
  --bar: #1f8a8a;
}
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background: transparent;
  color: var(--ink);
  font-family: "Segoe UI", ui-sans-serif, system-ui, -apple-system, sans-serif;
}
.shell {
  background: linear-gradient(180deg, var(--card) 0%, var(--bg) 140px);
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  max-width: 560px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px 14px;
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%);
  color: #fff;
}
.brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.logo {
  font-size: 12px;
  letter-spacing: 0.16em;
  font-weight: 700;
  color: #9ad8d4;
}
.title {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
}
.vin {
  margin-top: 6px;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: #c9d6e6;
  word-break: break-all;
}
.badge {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
}
.body { padding: 16px 18px 8px; }
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
}
.row {
  padding: 10px 11px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.row.wide { grid-column: 1 / -1; }
.k {
  display: block;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 3px;
}
.v { font-size: 14px; font-weight: 650; }
.section {
  margin: 4px 0 12px;
}
.section h3 {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
.band {
  display: grid;
  grid-template-columns: 92px 1fr 84px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.band span { font-size: 12px; color: var(--muted); }
.band strong { font-size: 13px; text-align: right; }
.track {
  height: 8px;
  background: #e6edf5;
  border-radius: 99px;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: linear-gradient(90deg, #1f8a8a, #2aa8a0);
  border-radius: 99px;
}
.list { display: flex; flex-direction: column; gap: 10px; }
.recall {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 12px;
  padding: 12px;
}
.recall-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
}
.recall h4 { margin: 0; font-size: 14px; }
.meta { color: var(--muted); font-size: 12px; margin: 4px 0 8px; }
.p { margin: 0 0 6px; font-size: 13px; line-height: 1.45; }
.pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.pill {
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 3px 8px;
}
.pill.warn { background: var(--warn-soft); color: var(--warn); }
.pill.ok { background: var(--ok-soft); color: var(--ok); }
.pill.accent { background: var(--accent-soft); color: var(--accent); }
.empty {
  padding: 18px;
  text-align: center;
  background: var(--ok-soft);
  color: var(--ok);
  border-radius: 12px;
  font-weight: 650;
}
.footer {
  padding: 10px 18px 14px;
  font-size: 11px;
  color: var(--muted);
}
`;

const BRIDGE_JS = `
function unwrap(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (payload.structuredContent) return payload.structuredContent;
  return payload;
}
function currentOutput() {
  if (window.__CARSXE_PREVIEW__) return window.__CARSXE_PREVIEW__;
  if (window.openai && window.openai.toolOutput) return unwrap(window.openai.toolOutput);
  return null;
}
function subscribe(render) {
  const first = currentOutput();
  if (first) render(first);
  window.addEventListener("message", function (event) {
    if (event.source !== window.parent) return;
    var message = event.data;
    if (!message || message.jsonrpc !== "2.0") return;
    if (message.method === "ui/notifications/tool-result") {
      render(unwrap(message.params));
    }
    if (message.method === "ui/notifications/tool-input" && !currentOutput()) {
      render(unwrap(message.params));
    }
  }, { passive: true });
}
function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function money(value) {
  if (value == null || value === "") return "—";
  var n = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!isFinite(n)) return esc(value);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function vehicleTitle(d) {
  return [d.year, d.make, d.model, d.trim].filter(Boolean).join(" ") || "Vehicle";
}
`;

function htmlDocument(title: string, body: string, renderJs: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div id="root" class="shell"><div class="body">Loading…</div></div>
  <script>
${BRIDGE_JS}
${renderJs}
  </script>
</body>
</html>`;
}

export function vehicleCardHtml(): string {
  return htmlDocument(
    "CarsXE vehicle card",
    "",
    `
function render(d) {
  if (!d) return;
  var mpg = d.cityMpg || d.highwayMpg
    ? [d.cityMpg ? d.cityMpg + " city" : null, d.highwayMpg ? d.highwayMpg + " hwy" : null].filter(Boolean).join(" / ")
    : "—";
  document.getElementById("root").innerHTML =
    '<div class="header">' +
      '<div class="brand"><div class="logo">CARSXE</div><h1 class="title">' + esc(vehicleTitle(d)) + '</h1><div class="vin">' + esc(d.vin || "VIN unavailable") + '</div></div>' +
      '<div class="badge">Specs</div>' +
    '</div>' +
    '<div class="body"><div class="grid">' +
      cell("Style", d.style) +
      cell("Engine", d.engine) +
      cell("Transmission", d.transmission) +
      cell("Drivetrain", d.drivetrain) +
      cell("Fuel", d.fuelType) +
      cell("Economy", mpg === "—" ? null : mpg) +
      cell("Seating", d.seating) +
      cell("MSRP", d.msrp ? money(d.msrp) : null) +
      cell("Built", d.madeIn, true) +
    '</div></div>' +
    '<div class="footer">Vehicle identity via CarsXE</div>';
}
function cell(label, value, wide) {
  if (!value) return "";
  return '<div class="row' + (wide ? " wide" : "") + '"><span class="k">' + esc(label) + '</span><div class="v">' + esc(value) + '</div></div>';
}
subscribe(render);
`,
  );
}

export function marketValueHtml(): string {
  return htmlDocument(
    "CarsXE market value",
    "",
    `
function num(value) {
  var n = Number(String(value == null ? "" : value).replace(/[^0-9.-]/g, ""));
  return isFinite(n) ? n : 0;
}
function band(label, value, max) {
  var pct = max > 0 ? Math.max(8, Math.round((num(value) / max) * 100)) : 0;
  return '<div class="band"><span>' + esc(label) + '</span><div class="track"><div class="fill" style="width:' + pct + '%"></div></div><strong>' + money(value) + '</strong></div>';
}
function render(d) {
  if (!d) return;
  var retail = [d.retailExcellent, d.retailClean, d.retailAverage, d.retailRough];
  var trade = [d.tradeInClean, d.tradeInAverage, d.tradeInRough];
  var max = Math.max.apply(null, retail.concat(trade).map(num).concat([1]));
  document.getElementById("root").innerHTML =
    '<div class="header">' +
      '<div class="brand"><div class="logo">CARSXE</div><h1 class="title">' + esc(vehicleTitle(d)) + '</h1><div class="vin">' + esc(d.vin || "VIN unavailable") + (d.state ? " · " + esc(d.state) : "") + '</div></div>' +
      '<div class="badge">Market value</div>' +
    '</div>' +
    '<div class="body">' +
      '<div class="section"><h3>Retail</h3>' +
        band("Excellent", d.retailExcellent, max) +
        band("Clean", d.retailClean, max) +
        band("Average", d.retailAverage, max) +
        band("Rough", d.retailRough, max) +
      '</div>' +
      '<div class="section"><h3>Trade-in</h3>' +
        band("Clean", d.tradeInClean, max) +
        band("Average", d.tradeInAverage, max) +
        band("Rough", d.tradeInRough, max) +
      '</div>' +
      (d.msrp ? '<div class="row wide"><span class="k">Original MSRP</span><div class="v">' + money(d.msrp) + '</div></div>' : '') +
    '</div>' +
    '<div class="footer">Market values via CarsXE · estimates only</div>';
}
subscribe(render);
`,
  );
}

export function recallsHtml(): string {
  return htmlDocument(
    "CarsXE recalls",
    "",
    `
function render(d) {
  if (!d) return;
  var items = Array.isArray(d.recalls) ? d.recalls : [];
  var count = d.recallCount != null ? d.recallCount : items.length;
  var list;
  if (!d.hasRecalls && items.length === 0) {
    list = '<div class="empty">No open recalls for this vehicle.</div>';
  } else {
    list = '<div class="list">' + items.map(function (r) {
      var pills = "";
      if (r.dontDrive) pills += '<span class="pill warn">Do not drive</span>';
      if (r.stopSale) pills += '<span class="pill warn">Stop sale</span>';
      if (r.remedyAvailable) pills += '<span class="pill ok">Remedy available</span>';
      if (r.status) pills += '<span class="pill accent">' + esc(r.status) + '</span>';
      return '<article class="recall">' +
        '<div class="recall-top"><h4>' + esc(r.component || r.name || "Recall") + '</h4><span class="meta">' + esc(r.nhtsaId || "") + '</span></div>' +
        '<div class="meta">' + esc([r.date, r.name].filter(Boolean).join(" · ")) + '</div>' +
        (r.description ? '<p class="p">' + esc(r.description) + '</p>' : '') +
        (r.risk ? '<p class="p">' + esc(r.risk) + '</p>' : '') +
        (r.remedy ? '<p class="p">' + esc(r.remedy) + '</p>' : '') +
        (pills ? '<div class="pills">' + pills + '</div>' : '') +
      '</article>';
    }).join("") + '</div>';
  }
  document.getElementById("root").innerHTML =
    '<div class="header">' +
      '<div class="brand"><div class="logo">CARSXE</div><h1 class="title">' + esc(vehicleTitle(d)) + '</h1><div class="vin">' + esc(d.vin || "VIN unavailable") + '</div></div>' +
      '<div class="badge">' + (count ? count + " recall" + (count === 1 ? "" : "s") : "Recalls") + '</div>' +
    '</div>' +
    '<div class="body">' + list + '</div>' +
    '<div class="footer">Recall data via CarsXE · confirm status with a dealer</div>';
}
subscribe(render);
`,
  );
}

export function previewHtml(
  kind: "vehicle" | "marketValue" | "recalls",
  data?: VehicleCard | MarketValueCard | RecallsCard,
): string {
  const templates = {
    vehicle: vehicleCardHtml(),
    marketValue: marketValueHtml(),
    recalls: recallsHtml(),
  };
  const payload = {
    vehicle: data ?? PREVIEW_VEHICLE_CARD,
    marketValue: data ?? PREVIEW_MARKET_VALUE,
    recalls: data ?? PREVIEW_RECALLS,
  }[kind];
  return templates[kind].replace(
    "<script>",
    `<script>window.__CARSXE_PREVIEW__ = ${JSON.stringify(payload)};`,
  );
}
