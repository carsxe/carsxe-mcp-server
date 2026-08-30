---
name: vehicle-recalls
description: Get safety recall information by VIN via the CarsXE MCP tool get_vehicle_recalls. Use when the user asks about open recalls, campaign status, risk, or remedy for a 17-character VIN.
---

# Vehicle recalls

Use the CarsXE MCP tool `get_vehicle_recalls`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `get_vehicle_recalls`
- **Required:** `vin` — 17-character Vehicle Identification Number

## When to use

- Open or historical safety recalls for a VIN
- Pre-purchase or service-shop recall checks

## Notes

- VIN must be exactly 17 characters.
- Pair with `get_vehicle_history` or `get_vehicle_specs` when the user wants a fuller picture.
