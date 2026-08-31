---
name: market-value
description: Get estimated market value by VIN via the CarsXE MCP tool get_market_value. Use for retail, trade-in, or fair-price questions. Optional state, mileage, and condition (excellent, clean, average, rough) refine the estimate.
---

# Market value

Use the CarsXE MCP tool `get_market_value`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `get_market_value`
- **Required:** `vin` — 17-character Vehicle Identification Number
- **Optional:** `state` — US state abbreviation
- **Optional:** `mileage` — current mileage (number)
- **Optional:** `condition` — one of `excellent`, `clean`, `average`, `rough`

## When to use

- Retail, trade-in, or fair purchase price for a VIN
- Value adjusted by mileage, condition, or state

## Notes

- VIN must be exactly 17 characters.
- Pass optional filters only when the user provides them.
