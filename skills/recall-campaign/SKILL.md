---
name: recall-campaign
description: Look up a manufacturer recall campaign code (e.g. Volkswagen 37M2) via the CarsXE MCP tool get_recall_campaign. Use when the user has a campaign code from a repair order, owner letter, or condition report and wants to know what the campaign is.
---

# Recall campaign by manufacturer code

Use the CarsXE MCP tool `get_recall_campaign`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `get_recall_campaign`
- **Required:** `make` — vehicle make (e.g. `Volkswagen`)
- **Required:** `code` — manufacturer campaign code (e.g. `37M2`)

## When to use

- The user quotes a campaign code from a repair order, owner letter, or auction condition report
- Resolving a manufacturer code to its NHTSA campaign number, component, and affected models

## Notes

- A code that is not found returns "No campaign found for this make and campaign code". It is not billed; suggest checking the make spelling and sending the code as printed.
- A campaign covers a range of vehicles. Use `get_vehicle_recalls` with a VIN to confirm a specific vehicle is affected, or `get_recalls_by_ymm` for a model line.
