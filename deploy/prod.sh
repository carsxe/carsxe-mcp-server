#!/usr/bin/env bash
set -euo pipefail

PROJECT="carsxe-api"
SERVICE="carsxe-mcp"
REGION="${REGION:-us-central1}"
IMAGE="gcr.io/${PROJECT}/carsxe-mcp-server"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

echo "Building image..."
docker build -t "${IMAGE}" .

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
