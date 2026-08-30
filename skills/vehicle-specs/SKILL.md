---
name: vehicle-specs
description: Get comprehensive vehicle specifications by VIN via the CarsXE MCP tool get_vehicle_specs. Use when the user asks for specs, trim, engine, dimensions, colors, or equipment for a 17-character VIN.
---

# Vehicle specs

Use the CarsXE MCP tool `get_vehicle_specs`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `get_vehicle_specs`
- **Required:** `vin` — 17-character Vehicle Identification Number

## When to use

- Full specs for a VIN (year, make, model, engine, dimensions, colors, equipment)
- Trim-level or engine questions when a VIN is available

## Notes

- VIN must be exactly 17 characters.
- After decoding a plate or extracting a VIN from an image, pass that VIN here for specs.
