---
name: plate-decoder
description: Decode a license plate to VIN and basic vehicle info via the CarsXE MCP tool decode_license_plate. Use when the user has a plate number and state (and optional country) rather than a VIN.
---

# Plate decoder

Use the CarsXE MCP tool `decode_license_plate`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `decode_license_plate`
- **Required:** `plate` — license plate number
- **Required:** `state` — 2-letter state abbreviation (e.g. `CA`)
- **Optional:** `country` — 2-letter country code (default `US`)

## When to use

- Look up a vehicle from a plate instead of a VIN
- Need VIN, make, model, or year from a plate + state

## Notes

- `state` is a 2-character abbreviation.
- After decoding, chain to `get_vehicle_specs`, `get_vehicle_history`, `get_vehicle_recalls`, or `get_market_value` with the returned VIN.
