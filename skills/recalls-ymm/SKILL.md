---
name: recalls-ymm
description: Get safety recall information by year, make, and model via the CarsXE MCP tool get_recalls_by_ymm. Use when the user asks about recalls for a YMM and does not have a VIN.
---

# Recalls by year / make / model

Use the CarsXE MCP tool `get_recalls_by_ymm`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `get_recalls_by_ymm`
- **Required:** `year` — 4-digit model year (e.g. `2019`)
- **Required:** `make` — vehicle make (e.g. `Toyota`)
- **Required:** `model` — vehicle model (e.g. `Camry`)

## When to use

- Recall checks for a model line when no VIN is available
- Fleet or listing recall summaries by YMM

## Notes

- Prefer `get_vehicle_recalls` when the user has a 17-character VIN.
- For many VINs, use the recalls-batch tools instead.
