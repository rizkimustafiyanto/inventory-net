#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-deploy}"
if [ "${MODE}" != "deploy" ] && [ "${MODE}" != "rollback" ]; then
  echo "Usage: $0 [deploy|rollback]"
  exit 1
fi

VPS_PATH="${VPS_PATH:-/opt/inventory_net}"
COMPOSE_FILE="${COMPOSE_FILE:-${VPS_PATH}/docker-compose.prod.yml}"
BACKEND_ENV_FILE="${BACKEND_ENV_FILE:-${VPS_PATH}/backend/.env.production}"
FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE:-${VPS_PATH}/frontend/.env.production}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY_OWNER="${REGISTRY_OWNER:-}"
DEPLOY_TS="$(date +"%Y%m%d_%H%M%S")"
DEPLOY_LOG_DIR="${VPS_PATH}/deploy/logs"
DEPLOY_LOG_FILE="${DEPLOY_LOG_DIR}/deploy_${DEPLOY_TS}.log"
DEPLOY_STATE_DIR="${VPS_PATH}/deploy/state"
DEPLOY_STATE_FILE="${DEPLOY_STATE_DIR}/rollback.env"

mkdir -p "${DEPLOY_LOG_DIR}" "${DEPLOY_STATE_DIR}"

load_env_file() {
  local env_file="$1"
  if [ -f "${env_file}" ]; then
    set -a
    # shellcheck disable=SC1090
    . "${env_file}"
    set +a
    echo "[deploy] Loaded environment from ${env_file}."
  else
    echo "[deploy] ${env_file} not found. Continuing with existing env."
  fi
}

save_current_state() {
  local backend_container frontend_container backend_image frontend_image
  backend_container="$(docker compose -f "${COMPOSE_FILE}" ps -q backend 2>/dev/null || true)"
  frontend_container="$(docker compose -f "${COMPOSE_FILE}" ps -q frontend 2>/dev/null || true)"
  backend_image=""
  frontend_image=""

  if [ -n "${backend_container}" ]; then
    backend_image="$(docker inspect --format '{{.Image}}' "${backend_container}" 2>/dev/null || true)"
  fi
  if [ -n "${frontend_container}" ]; then
    frontend_image="$(docker inspect --format '{{.Image}}' "${frontend_container}" 2>/dev/null || true)"
  fi

  {
    echo "PREV_BACKEND_IMAGE=${backend_image}"
    echo "PREV_FRONTEND_IMAGE=${frontend_image}"
  } > "${DEPLOY_STATE_FILE}"
}

rollback() {
  echo "[deploy] Executing rollback to previous state..."
  if [ ! -f "${DEPLOY_STATE_FILE}" ]; then
    echo "[deploy] Error: No rollback state file found at ${DEPLOY_STATE_FILE}."
    exit 1
  fi

  # shellcheck disable=SC1090
  . "${DEPLOY_STATE_FILE}"
  docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans
  echo "[deploy] Rollback completed."
}

if [ "${MODE}" = "rollback" ]; then
  rollback | tee -a "${DEPLOY_LOG_FILE}"
  exit 0
fi

{
  echo "=========================================="
  echo " Starting deployment at $(date)"
  echo " Image Tag: ${IMAGE_TAG}"
  echo " Compose File: ${COMPOSE_FILE}"
  echo "=========================================="

  save_current_state

  # Pull new images
  echo "[deploy] Pulling latest images..."
  IMAGE_TAG="${IMAGE_TAG}" \
  REGISTRY_OWNER="${REGISTRY_OWNER}" \
  BACKEND_ENV_FILE="${BACKEND_ENV_FILE}" \
  FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE}" \
  docker compose -f "${COMPOSE_FILE}" pull backend frontend

  # Recreate & start services
  echo "[deploy] Applying compose configuration..."
  IMAGE_TAG="${IMAGE_TAG}" \
  REGISTRY_OWNER="${REGISTRY_OWNER}" \
  BACKEND_ENV_FILE="${BACKEND_ENV_FILE}" \
  FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE}" \
  docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans

  # Quick container health check
  echo "[deploy] Checking running services..."
  sleep 5
  docker compose -f "${COMPOSE_FILE}" ps

  # Prune unused dangling images
  echo "[deploy] Pruning dangling images..."
  docker image prune -f >/dev/null 2>&1 || true

  echo "=========================================="
  echo " Deployment finished successfully at $(date)"
  echo "=========================================="
} 2>&1 | tee -a "${DEPLOY_LOG_FILE}"
