#!/usr/bin/env bash
set -euo pipefail

BACKUP_FILE="${1:-}"
if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_backup_file.dmp.gz|path_to_backup_file.dmp>"
  exit 1
fi

VPS_PATH="${VPS_PATH:-/opt/inventory_net}"
CONTAINER_NAME="${CONTAINER_NAME:-inventory-oracle}"
ORACLE_PASSWORD="${ORACLE_PASSWORD:-YourPassword123}"
PDB_NAME="${PDB_NAME:-FREEPDB1}"
TS="$(date +"%Y%m%d_%H%M%S")"

if [ ! -f "${BACKUP_FILE}" ]; then
  if [ -f "${VPS_PATH}/backups/${BACKUP_FILE}" ]; then
    BACKUP_FILE="${VPS_PATH}/backups/${BACKUP_FILE}"
  else
    echo "::error::Backup file not found at ${BACKUP_FILE} or ${VPS_PATH}/backups/${BACKUP_FILE}!"
    exit 1
  fi
fi

# Safety Guard: Cegah restore file backup Staging ke database Production
if [[ "${CONTAINER_NAME}" == *"inventory-oracle"* ]] && [[ "${CONTAINER_NAME}" != *"staging"* ]] && [[ "${BACKUP_FILE}" == *"staging"* ]]; then
  echo "::error::[SAFETY GUARD] DILARANG me-restore file backup Staging ('${BACKUP_FILE}') ke database Production ('${CONTAINER_NAME}')!"
  echo "Operasi ini dibatalkan secara otomatis untuk melindungi keutuhan data produksi dari data dummy/pengujian."
  exit 1
fi

# Load environment variables from backend .env if present
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

echo "[restore] Menyelaraskan user system di Oracle..."
docker exec -i "${CONTAINER_NAME}" sqlplus -s / as sysdba << EOF || true
ALTER SESSION SET CONTAINER = ${PDB_NAME};
ALTER USER system IDENTIFIED BY "${ORACLE_PASSWORD}" ACCOUNT UNLOCK;
EXIT;
EOF

echo "[restore] Preparing restore from: ${BACKUP_FILE}"
echo "[restore] Target container: ${CONTAINER_NAME}"

# 1. Determine dump file name and decompress if gzipped
RAW_DUMP_FILE="restore_${TS}.dmp"
TMP_RESTORE_DIR="/tmp/inventory_restore_${TS}"
mkdir -p "${TMP_RESTORE_DIR}"

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  echo "[restore] Decompressing gzip archive..."
  gunzip -c "${BACKUP_FILE}" > "${TMP_RESTORE_DIR}/${RAW_DUMP_FILE}"
else
  cp "${BACKUP_FILE}" "${TMP_RESTORE_DIR}/${RAW_DUMP_FILE}"
fi

# 2. Locate Data Pump Directory inside the container
DP_DIR="$(docker exec "${CONTAINER_NAME}" bash -c "find /opt/oracle -type d -name 'dpdump' 2>/dev/null | head -n 1")"
DEST_DIR="$(docker exec "${CONTAINER_NAME}" bash -c "find '${DP_DIR}' -mindepth 1 -maxdepth 1 -type d 2>/dev/null | head -n 1")"

if [ -z "${DEST_DIR}" ]; then
  DEST_DIR="${DP_DIR}"
fi

echo "[restore] Copying dump file to container (${DEST_DIR}/${RAW_DUMP_FILE})..."
docker cp "${TMP_RESTORE_DIR}/${RAW_DUMP_FILE}" "${CONTAINER_NAME}:${DEST_DIR}/${RAW_DUMP_FILE}"
docker exec "${CONTAINER_NAME}" chmod 666 "${DEST_DIR}/${RAW_DUMP_FILE}"

# 3. Run Data Pump Import (table_exists_action=replace)
echo "[restore] Executing Data Pump impdp..."
docker exec "${CONTAINER_NAME}" impdp \
  "system/${ORACLE_PASSWORD}@${PDB_NAME}" \
  schemas=inventory_user \
  directory=DATA_PUMP_DIR \
  dumpfile="${RAW_DUMP_FILE}" \
  logfile="restore_${TS}.log" \
  table_exists_action=replace || true

# 4. Clean up temporary files
echo "[restore] Cleaning up temporary dump files..."
rm -rf "${TMP_RESTORE_DIR}"
docker exec "${CONTAINER_NAME}" rm -f "${DEST_DIR}/${RAW_DUMP_FILE}" 2>/dev/null || true

echo "=========================================="
echo " Restore completed successfully at $(date)"
echo "=========================================="
