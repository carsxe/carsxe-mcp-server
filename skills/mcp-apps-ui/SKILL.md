---
name: mcp-apps-ui
description: Render CarsXE vehicle, market-value, or recalls cards in ChatGPT / MCP Apps hosts. Use after fetching data with get_vehicle_specs, get_market_value, or get_vehicle_recalls.
---

# MCP Apps UI (data → render)

Do not attach a widget to fetch tools. Call the data tool first, then the matching render tool.

| Data tool | Render tool | UI resource |
| --- | --- | --- |
| `get_vehicle_specs` | `render_vehicle_card` | `ui://carsxe/vehicle-card.html` |
| `get_market_value` | `render_market_value` | `ui://carsxe/market-value.html` |
| `get_vehicle_recalls` | `render_recalls` | `ui://carsxe/recalls.html` |

Pass the data tool's `structuredContent` fields into the render tool. Auth stays API key / OAuth. Preview mock cards with `npm run preview:ui` and open `previews/*.html`.
