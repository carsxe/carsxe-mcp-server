---
name: vehicle-history
description: Get a comprehensive vehicle history report by VIN via the CarsXE MCP tool get_vehicle_history. Use for accidents, owners, titles, junk/salvage, insurance brands, or odometer history.
---

# Vehicle history

Use the CarsXE MCP tool `get_vehicle_history`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `get_vehicle_history`
- **Required:** `vin` — 17-character Vehicle Identification Number
- **Optional:** `format` — response format (`json` or `xml`, default `json`)

## When to use

- Accident, salvage, title, owner-count, or odometer questions for a VIN
- Pre-purchase history review

## Notes

- VIN must be exactly 17 characters.
- Prefer leaving `format` unset unless the user asks for XML.
