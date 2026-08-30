---
name: lien-theft
description: Check lien and theft records by VIN via the CarsXE MCP tool check_lien_and_theft. Use when buying a used car and the user wants lien-holder, stolen, recovery, or clean-title verification.
---

# Lien and theft

Use the CarsXE MCP tool `check_lien_and_theft`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `check_lien_and_theft`
- **Required:** `vin` — 17-character Vehicle Identification Number

## When to use

- Lien-holder lookup
- Stolen/recovery status or clean-title verification before purchase

## Notes

- VIN must be exactly 17 characters.
- Combine with `get_vehicle_history` for a broader title and brand picture.
