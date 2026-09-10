---
name: ymm-options
description: List cascading year, make, model, trim, or variant options via the CarsXE MCP tool get_ymm_options. Use to populate dropdowns or discover valid YMM values.
---

# Year / make / model options

Use the CarsXE MCP tool `get_ymm_options`. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tool

- **Name:** `get_ymm_options`
- **Optional:** `dimension` — `years` | `makes` | `models` | `trims` | `variants`
- **Optional:** `year`, `make`, `model`, `trim`

## Typical flow

1. No filters → years
2. Add `year` → makes
3. Add `make` → models
4. Add `model` → variants

## Notes

- `dimension=variants` with `year` + `make` and no `model` returns every variant for that make and is billed per model (`modelCount`).
- Pair with `get_year_make_model` once the user picks a specific YMM.
