---
name: recalls-batch
description: Submit and retrieve async bulk recall checks (up to 10,000 VINs) via submit_recalls_batch, get_recalls_batch_status, get_recalls_batch_results, and download_recalls_batch.
---

# Recalls batch

Use the CarsXE MCP recalls-batch tools. Auth is client-managed (API key or OAuth); do not embed secrets in plugin config.

## Tools

1. `submit_recalls_batch` — `vins` and/or `csv` and/or `csvUrl` (required: at least one). Optional `webhookUrl`.
2. `get_recalls_batch_status` — required `batchId`
3. `get_recalls_batch_results` — required `batchId` (after `completed` or `partial`)
4. `download_recalls_batch` — required `batchId` (CSV preview)

## When to use

- Fleet, inventory, or auction recall scans
- More than a handful of VINs

## Notes

- Submit returns a `batchId` immediately. Poll status until `completed` or `partial`.
- Cached batches can complete on submit.
- Combined unique VIN count must not exceed 10,000.
