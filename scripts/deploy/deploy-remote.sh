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

# Port Configuration from environment / secrets
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
ORACLE_PORT="${ORACLE_PORT:-1521}"

DEPLOY_TS="$(date +"%Y%m%d_%H%M%S")"
DEPLOY_LOG_DIR="${VPS_PATH}/deploy/logs"
DEPLOY_LOG_FILE="${DEPLOY_LOG_DIR}/deploy_${DEPLOY_TS}.log"
DEPLOY_STATE_DIR="${VPS_PATH}/deploy/state"
DEPLOY_STATE_FILE="${DEPLOY_STATE_DIR}/rollback.env"

mkdir -p "${DEPLOY_LOG_DIR}" "${DEPLOY_STATE_DIR}"

load_env_file() {
  local env_file="$1"
  if [ -f "${env_file}" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      line="${line//$'\r'/}"
      [[ "$line" =~ ^[[:space:]]*# ]] && continue
      [[ -z "${line// }" ]] && continue
      if [[ "$line" =~ ^([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$ ]]; then
        local key="${BASH_REMATCH[1]}"
        local val="${BASH_REMATCH[2]}"
        if [[ "$val" =~ ^\"(.*)\"$ ]] || [[ "$val" =~ ^\'(.*)\'$ ]]; then
          val="${BASH_REMATCH[1]}"
        fi
        export "$key"="$val"
      fi
    done < "${env_file}"
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
  FRONTEND_PORT="${FRONTEND_PORT}" \
  BACKEND_PORT="${BACKEND_PORT}" \
  ORACLE_PORT="${ORACLE_PORT}" \
  docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans
  echo "[deploy] Rollback completed."
}

check_port_collision() {
  local port="$1"
  local expected_container="$2"
  local service_name="$3"

  # 1. Cek apakah ada container Docker yang sedang mem-publish host port ini (format docker ps: ':PORT->')
  local running_containers
  running_containers=$(docker ps --format '{{.Names}}\t{{.Ports}}' 2>/dev/null | grep -E ":${port}->" | awk '{print $1}' || true)

  if [ -n "${running_containers}" ]; then
    for c in ${running_containers}; do
      if [ "${c}" != "${expected_container}" ]; then
        echo "::error::[PORT COLLISION ABORT] Port ${port} (${service_name}) sudah digunakan oleh container '${c}'! Diharapkan container '${expected_container}'. Deployment DIBATALKAN untuk mencegah bentrok layanan."
        return 1
      fi
    done
    echo "[check-port] Port ${port} (${service_name}) saat ini digunakan oleh container '${expected_container}' milik service ini sendiri (Aman untuk re-deploy/update)."
    return 0
  fi

  # 2. Cek apakah ada proses host di luar Docker yang mendengarkan port ini
  local host_listen=""
  if command -v ss >/dev/null 2>&1; then
    host_listen=$(ss -tulpn 2>/dev/null | grep -E ":${port}(\s|$)" || true)
  elif command -v netstat >/dev/null 2>&1; then
    host_listen=$(netstat -tulpn 2>/dev/null | grep -E ":${port}(\s|$)" || true)
  elif command -v lsof >/dev/null 2>&1; then
    host_listen=$(lsof -iTCP:"${port}" -sTCP:LISTEN -P -n 2>/dev/null || true)
  fi

  if [ -n "${host_listen}" ]; then
    echo "::error::[PORT COLLISION ABORT] Port ${port} (${service_name}) sudah digunakan oleh proses host di server: ${host_listen}! Deployment DIBATALKAN."
    return 1
  fi

  echo "[check-port] Port ${port} (${service_name}) aman dan tersedia."
  return 0
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
  echo " Target Ports: Frontend=${FRONTEND_PORT}, Backend=${BACKEND_PORT}, Oracle=${ORACLE_PORT}"
  echo "=========================================="

  # Simpan port eksternal yang di-pass dari GitHub Secrets
  EXT_FRONTEND_PORT="${FRONTEND_PORT:-}"
  EXT_BACKEND_PORT="${BACKEND_PORT:-}"
  EXT_ORACLE_PORT="${ORACLE_PORT:-}"

  # Muat file environment jika ada (agar variabel seperti ORACLE_PASSWORD, REDIS_PASSWORD terbaca)
  load_env_file "${BACKEND_ENV_FILE}"
  load_env_file "${FRONTEND_ENV_FILE}"

  # Prioritaskan port yang di-pass dari GitHub Action Secret jika diset
  [ -n "${EXT_FRONTEND_PORT}" ] && FRONTEND_PORT="${EXT_FRONTEND_PORT}"
  [ -n "${EXT_BACKEND_PORT}" ] && BACKEND_PORT="${EXT_BACKEND_PORT}"
  [ -n "${EXT_ORACLE_PORT}" ] && ORACLE_PORT="${EXT_ORACLE_PORT}"

  # Ambil nama container dari compose file yang aktif
  EXPECTED_FRONTEND=$(grep -E '^\s*container_name:' "${COMPOSE_FILE}" | grep -E 'frontend' | awk '{print $2}' || echo "inventory-frontend")
  EXPECTED_BACKEND=$(grep -E '^\s*container_name:' "${COMPOSE_FILE}" | grep -E 'backend' | awk '{print $2}' || echo "inventory-backend")
  EXPECTED_ORACLE=$(grep -E '^\s*container_name:' "${COMPOSE_FILE}" | grep -E 'oracle' | awk '{print $2}' || echo "inventory-oracle")

  echo "[deploy] Memeriksa ketersediaan port (Collision Protection)..."
  if ! check_port_collision "${FRONTEND_PORT}" "${EXPECTED_FRONTEND}" "Frontend"; then
    echo "ABORT_REASON=Port ${FRONTEND_PORT} (Frontend) bentrok dengan proses lain"
    exit 1
  fi

  if ! check_port_collision "${BACKEND_PORT}" "${EXPECTED_BACKEND}" "Backend"; then
    echo "ABORT_REASON=Port ${BACKEND_PORT} (Backend) bentrok dengan proses lain"
    exit 1
  fi

  # Hanya periksa port Oracle jika compose file memang mengekspose port Oracle ke host
  if grep -q "ORACLE_PORT" "${COMPOSE_FILE}" && ! grep -E "^\s*#.*ORACLE_PORT" "${COMPOSE_FILE}" >/dev/null 2>&1; then
    if ! check_port_collision "${ORACLE_PORT}" "${EXPECTED_ORACLE}" "Oracle Database"; then
      echo "ABORT_REASON=Port ${ORACLE_PORT} (Oracle) bentrok dengan proses lain"
      exit 1
    fi
  else
    echo "[check-port] Port Oracle (${ORACLE_PORT}) tidak diekspos ke host (internal docker network only). Melewati pengecekan collision host."
  fi

  save_current_state

  # 1. Start database & cache services first
  echo "[deploy] Starting database & cache services (oracle, redis)..."
  IMAGE_TAG="${IMAGE_TAG}" \
  REGISTRY_OWNER="${REGISTRY_OWNER}" \
  BACKEND_ENV_FILE="${BACKEND_ENV_FILE}" \
  FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE}" \
  FRONTEND_PORT="${FRONTEND_PORT}" \
  BACKEND_PORT="${BACKEND_PORT}" \
  ORACLE_PORT="${ORACLE_PORT}" \
  docker compose -f "${COMPOSE_FILE}" up -d oracle redis

  # 2. Wait for Oracle DB to become healthy (maks 45s)
  echo "[deploy] Memeriksa kesiapan Oracle DB..."
  for i in $(seq 1 45); do
    ORACLE_STATUS=$(docker inspect --format '{{.State.Health.Status}}' "${EXPECTED_ORACLE}" 2>/dev/null || echo "starting")
    if [ "${ORACLE_STATUS}" = "healthy" ]; then
      echo "[deploy] Oracle DB dalam status HEALTHY (detik ke-${i})."
      break
    fi
    sleep 1
  done

  # 3. Sinkronisasi User & Password di Oracle DB (FREEPDB1)
  ORACLE_APP_PWD="${APP_USER_PASSWORD:-}"
  if [ -z "${ORACLE_APP_PWD}" ] && [ -n "${ConnectionStrings__OracleConnection:-}" ]; then
    ORACLE_APP_PWD=$(echo "${ConnectionStrings__OracleConnection}" | sed -n 's/.*[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]=\([^;]*\).*/\1/p')
  fi
  ORACLE_APP_PWD="${ORACLE_APP_PWD:-YourPassword123}"

  ORACLE_APP_USER="${APP_USER:-}"
  if [ -z "${ORACLE_APP_USER}" ] && [ -n "${ConnectionStrings__OracleConnection:-}" ]; then
    ORACLE_APP_USER=$(echo "${ConnectionStrings__OracleConnection}" | sed -n 's/.*[Uu][Ss][Ee][Rr][[:space:]]*[Ii][Dd]=\([^;]*\).*/\1/p')
  fi
  ORACLE_APP_USER="${ORACLE_APP_USER:-inventory_user}"

  echo "[deploy] Menyelaraskan kredensial database user '${ORACLE_APP_USER}' pada Oracle DB..."
  docker exec -i "${EXPECTED_ORACLE}" sqlplus -s / as sysdba << EOF || true
ALTER SESSION SET CONTAINER = FREEPDB1;
BEGIN
  EXECUTE IMMEDIATE 'ALTER USER ${ORACLE_APP_USER} IDENTIFIED BY "${ORACLE_APP_PWD}" ACCOUNT UNLOCK';
EXCEPTION
  WHEN OTHERS THEN
    EXECUTE IMMEDIATE 'CREATE USER ${ORACLE_APP_USER} IDENTIFIED BY "${ORACLE_APP_PWD}"';
    EXECUTE IMMEDIATE 'GRANT CONNECT, RESOURCE, DBA TO ${ORACLE_APP_USER}';
    EXECUTE IMMEDIATE 'ALTER USER ${ORACLE_APP_USER} QUOTA UNLIMITED ON USERS';
END;
/
EXIT;
EOF

  # 4. Pull new images
  echo "[deploy] Pulling latest images..."
  IMAGE_TAG="${IMAGE_TAG}" \
  REGISTRY_OWNER="${REGISTRY_OWNER}" \
  BACKEND_ENV_FILE="${BACKEND_ENV_FILE}" \
  FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE}" \
  FRONTEND_PORT="${FRONTEND_PORT}" \
  BACKEND_PORT="${BACKEND_PORT}" \
  ORACLE_PORT="${ORACLE_PORT}" \
  docker compose -f "${COMPOSE_FILE}" pull backend frontend

  # 5. Recreate & start services
  echo "[deploy] Applying compose configuration..."
  IMAGE_TAG="${IMAGE_TAG}" \
  REGISTRY_OWNER="${REGISTRY_OWNER}" \
  BACKEND_ENV_FILE="${BACKEND_ENV_FILE}" \
  FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE}" \
  FRONTEND_PORT="${FRONTEND_PORT}" \
  BACKEND_PORT="${BACKEND_PORT}" \
  ORACLE_PORT="${ORACLE_PORT}" \
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
