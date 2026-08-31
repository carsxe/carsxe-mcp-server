---
name: year-make-model
description: Look up vehicle info by year, make, model, and optional trim via the CarsXE MCP tool get_year_make_model. Use when the user has YMM (not a VIN) and wants specs, colors, features, options, or packages.
---

# Year make model

Use the CarsXE MCP tool `get_year_make_model`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `get_year_make_model`
- **Required:** `year` — manufacturing year (e.g. `2023`)
- **Required:** `make` — vehicle make (e.g. `Toyota`)
- **Required:** `model` — vehicle model (e.g. `Camry`)
- **Optional:** `trim` — vehicle trim (e.g. `XLE`)

## When to use

- Specs, colors, features, options, or packages when only year/make/model is known
- Trim-specific questions without a VIN

## Notes

- This tool is YMM-based, not VIN-based.
- Pass `trim` only when the user specifies one.
