---
name: international-vin
description: Decode an international VIN via the CarsXE MCP tool decode_international_vin. Use for non-US or European/Asian VINs when the user wants manufacturer, specs, or emissions details beyond the US specs tool.
---

# International VIN

Use the CarsXE MCP tool `decode_international_vin`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `decode_international_vin`
- **Required:** `vin` — 17-character Vehicle Identification Number

## When to use

- European, Asian, or other non-US VIN decode
- Manufacturer, specs, or emissions details for an international VIN

## Notes

- VIN must be exactly 17 characters.
- Prefer this over `get_vehicle_specs` when the user identifies the VIN as international or non-US.
