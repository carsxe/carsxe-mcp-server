---
name: vehicle-images
description: Get vehicle photos by make and model via the CarsXE MCP tool get_vehicle_images. Use when the user wants pictures of a vehicle. Optional year, trim, color, angle, photoType, size, license, transparent, and format filters.
---

# Vehicle images

Use the CarsXE MCP tool `get_vehicle_images`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `get_vehicle_images`
- **Required:** `make` — vehicle make
- **Required:** `model` — vehicle model
- **Optional:** `year` — vehicle year
- **Optional:** `trim` — vehicle trim
- **Optional:** `color` — vehicle color
- **Optional:** `transparent` — transparent background (boolean)
- **Optional:** `angle` — `front`, `side`, or `back`
- **Optional:** `photoType` — `interior`, `exterior`, or `engine`
- **Optional:** `size` — `Small`, `Medium`, `Large`, `Wallpaper`, or `All`
- **Optional:** `license` — `Public`, `Share`, `ShareCommercially`, `Modify`, or `ModifyCommercially`
- **Optional:** `format` — `json` or `xml` (default `json`)

## When to use

- Show photos of a make/model (optionally year, color, trim, angle)

## Notes

- This tool is make/model based, not VIN-based.
- Apply optional filters only when the user specifies them.
