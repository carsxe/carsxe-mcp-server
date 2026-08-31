#!/usr/bin/env bash
set -euo pipefail

# GCP project, Cloud Run service, and image URI come from the environment.
# Do not default these to a specific organization's IDs.
if [[ -z "${PROJECT:-}" ]]; then
  echo "error: PROJECT is required (GCP project ID). Set it in the environment; do not commit it." >&2
  exit 1
fi
if [[ -z "${SERVICE:-}" ]]; then
  echo "error: SERVICE is required (Cloud Run service name). Set it in the environment; do not commit it." >&2
  exit 1
fi
if [[ -z "${IMAGE:-}" ]]; then
  echo "error: IMAGE is required (container image URI). Set it in the environment; do not commit it." >&2
  exit 1
fi

REGION="${REGION:-us-central1}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

echo "Building image..."
docker build --platform linux/amd64 -t "${IMAGE}" .

echo "Pushing image..."
docker push "${IMAGE}"

echo "Deploying to Cloud Run (${PROJECT} / ${SERVICE})..."
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --project "${PROJECT}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated

echo "Deploy complete."
