---
name: vin-ocr
description: Extract a VIN from a vehicle image URL via the CarsXE MCP tool extract_vin_from_image. Use when the user provides a direct URL to a VIN photo or scan rather than typing the VIN.
---

# VIN OCR

Use the CarsXE MCP tool `extract_vin_from_image`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `extract_vin_from_image`
- **Required:** `imageUrl` — direct URL to an image of a vehicle VIN (photo or scan)

## When to use

- VIN is in a dashboard, door-jamb, or scan photo
- User wants OCR candidates, confidence, or bounding box

## Notes

- `imageUrl` must be a direct image URL.
- After extraction, chain to VIN tools such as `get_vehicle_specs`, `get_vehicle_history`, or `get_vehicle_recalls`.
