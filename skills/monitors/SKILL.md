---
name: monitors
description: Create, list, update, pause, delete, import, run, and read alerts for CarsXE Monitoring watchlists via MCP tools. Use when the user asks about monitors, watchlists, fleet recall alerts, or scheduled vehicle checks.
---

# Monitoring watchlists

Use the CarsXE MCP monitor tools. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

Monitoring is a gated product. A 404 means the feature is off for the key or the monitor id does not exist. Docs: https://docs.carsxe.com/docs

## Tools

| Tool | Required | Notes |
| --- | --- | --- |
| `list_monitors` | — | Optional `limit` |
| `get_monitor` | `id` | Single watchlist |
| `create_monitor` | `name`, `vehicleType`, `vehicles`, `products`, `schedule`, `delivery` | `vehicleType` is `vin` or `plate` |
| `update_monitor` | `id` | Partial update; `paused` true/false to pause or resume |
| `delete_monitor` | `id` | Permanent delete |
| `import_monitor_vehicles` | `id` plus `vehicles` and/or `csv` | Add vehicles to an existing monitor |
| `run_monitor` | `id` | Run a check now |
| `list_monitor_alerts` | — | Optional `id` for one monitor; optional `limit` |

## Create example

- **name:** Fleet
- **vehicleType:** vin
- **vehicles:** `1C4JJXR64PW696340`
- **products:** recalls
- **schedule.frequency:** daily
- **delivery:** email

## When to use

- Set up a fleet or lot watchlist for recalls (or other products)
- Pause, resume, or delete an existing monitor
- Import a VIN/plate list, trigger a run, or read recent alerts
