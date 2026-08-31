---
name: plate-image-recognition
description: Extract license plate text from a vehicle image URL via the CarsXE MCP tool read_license_plate_from_image. Use when the user provides a direct image URL of a plate, not a typed plate number.
---

# Plate image recognition

Use the CarsXE MCP tool `read_license_plate_from_image`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `read_license_plate_from_image`
- **Required:** `imageUrl` — direct URL to an image of a vehicle license plate

## When to use

- User has a photo URL and wants the plate number
- First step before `decode_license_plate` when only an image is available

## Notes

- `imageUrl` must be a direct image URL.
- After recognition, call `decode_license_plate` with the plate, state, and country if the user provides them.
