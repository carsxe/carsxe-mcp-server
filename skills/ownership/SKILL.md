---
name: ownership
description: Enterprise owner and resident lookup via get_ownership_by_vin, get_ownership_by_person, get_ownership_by_address, and get_ownership_by_zip. Use when the user asks who owns a vehicle or who lives at an address or ZIP.
---

# Ownership (Enterprise)

Use the CarsXE MCP ownership tools. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config. These endpoints require an Enterprise `ownership` entitlement.

## Tools

- `get_ownership_by_vin` — required `vin`; optional `include`
- `get_ownership_by_person` — required `firstName`, `lastName`, `address`, `zip`; optional `include`
- `get_ownership_by_address` — required `address`, `zip`; optional `include`, `variant`
- `get_ownership_by_zip` — required `zip`; optional `gender`, `minAge`, `maxAge`, `income`, `page`, `limit`, `include`, `variant`

`include` is a comma-separated subset of `demographics,emails,phones,vehicle_history`.

## When to use

- Registered owner(s) for a VIN
- Contact details for a known name + address
- Residents at a street address
- Filtered people in a ZIP code

## Notes

- No match returns `no_data` and is not billed.
- Matches are billed per record (`owners` / `matches` / `records`). ZIP pages can consume a lot of quota.
- `address` is street only (no city/state).
- Do not add phone lookup unless the user explicitly asks and a phone tool exists.
