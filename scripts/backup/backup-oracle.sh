#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:-production}"
VPS_PATH="${VPS_PATH:-/opt/inventory_net}"
CONTAINER_NAME="${CONTAINER_NAME:-inventory-oracle}"
ORACLE_PASSWORD="${ORACLE_PASSWORD:-YourPassword123}"
PDB_NAME="${PDB_NAME:-FREEPDB1}"
BACKUP_DIR="${VPS_PATH}/backups"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "${BACKUP_DIR}"

TS="$(date +"%Y%m%d_%H%M%S")"
DUMP_FILE="backup_${ENV_NAME}_${TS}.dmp"
LOG_FILE="backup_${ENV_NAME}_${TS}.log"

echo "[backup] Starting Oracle Data Pump export for '${ENV_NAME}'..."
echo "[backup] Target container: ${CONTAINER_NAME}"
echo "[backup] Dump file: ${DUMP_FILE}"

# 1. Load environment variables from backend .env if present
if [ -f "${VPS_PATH}/backend/.env.production" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line//$'\r'/}"
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    if [[ "$line" =~ ^([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      if [[ "$val" =~ ^\"(.*)\"$ ]] || [[ "$val" =~ ^\'(.*)\'$ ]]; then
        val="${BASH_REMATCH[1]}"
      fi
      export "$key"="$val"
    fi
  done < "${VPS_PATH}/backend/.env.production"
fi

ORACLE_PASSWORD="${ORACLE_PASSWORD:-YourPassword123}"

echo "[backup] Menyelaraskan user system di Oracle..."
docker exec -i "${CONTAINER_NAME}" sqlplus -s / as sysdba << EOF || true
ALTER SESSION SET CONTAINER = ${PDB_NAME};
ALTER USER system IDENTIFIED BY "${ORACLE_PASSWORD}" ACCOUNT UNLOCK;
EXIT;
EOF

# 2. Run Data Pump Export inside the Oracle container
echo "[backup] Running Data Pump Export (expdp)..."
docker exec "${CONTAINER_NAME}" expdp \
  "system/${ORACLE_PASSWORD}@${PDB_NAME}" \
  schemas=inventory_user \
  directory=DATA_PUMP_DIR \
  dumpfile="${DUMP_FILE}" \
  logfile="${LOG_FILE}" \
  reuse_dumpfiles=YES

# 3. Locate dump file inside Oracle container
DUMP_SRC="$(docker exec "${CONTAINER_NAME}" bash -c "find /opt/oracle -name '${DUMP_FILE}' 2>/dev/null | head -n 1")"

if [ -z "${DUMP_SRC}" ]; then
  echo "::error::Dump file ${DUMP_FILE} not found inside container ${CONTAINER_NAME}!"
  exit 1
fi

# Set permissions so host user can read & compress the file
docker exec "${CONTAINER_NAME}" chmod 666 "${DUMP_SRC}"

# 4. Copy dump file from container to VPS backups directory
docker cp "${CONTAINER_NAME}:${DUMP_SRC}" "${BACKUP_DIR}/${DUMP_FILE}"
docker exec "${CONTAINER_NAME}" rm -f "${DUMP_SRC}"

# 5. Compress dump file with gzip
echo "[backup] Compressing ${DUMP_FILE} with gzip..."
gzip -9 -f "${BACKUP_DIR}/${DUMP_FILE}"

GZ_FILE="${BACKUP_DIR}/${DUMP_FILE}.gz"
FILE_SIZE_KB="$(du -k "${GZ_FILE}" | cut -f1)"

echo "[backup] Backup completed successfully: ${GZ_FILE} (${FILE_SIZE_KB} KB)"

# 5. Rotate old backups older than RETENTION_DAYS
echo "[backup] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "backup_${ENV_NAME}_*.dmp.gz" -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true

# 6. Output metadata for calling scripts / GitHub Actions
echo "OUTPUT_BACKUP_PATH=${GZ_FILE}"
echo "OUTPUT_BACKUP_NAME=${DUMP_FILE}.gz"
echo "OUTPUT_BACKUP_SIZE_KB=${FILE_SIZE_KB}"
