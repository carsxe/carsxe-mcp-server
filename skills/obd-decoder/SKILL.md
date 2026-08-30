---
name: obd-decoder
description: Decode an OBD-II diagnostic trouble code via the CarsXE MCP tool decode_obd_code. Use for check-engine or dashboard codes such as P0115, P0300, or C1234.
---

# OBD decoder

Use the CarsXE MCP tool `decode_obd_code`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `decode_obd_code`
- **Required:** `code` — OBD code (e.g. `P0115`)

## When to use

- Check-engine or dashboard DTC meaning and diagnosis
- Service-shop questions about a specific code

## Notes

- Pass the code as the user provided it (e.g. `P0115`, `P0300`, `C1234`).
- If the user also has a VIN, you can add `get_vehicle_specs` for vehicle context; the OBD tool itself only takes `code`.
