#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:-production}"
VPS_PATH="${VPS_PATH:-/opt/inventory_net}"
CONTAINER_NAME="${CONTAINER_NAME:-inventory-backend}"
BACKUP_DIR="${VPS_PATH}/backups"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "${BACKUP_DIR}"

TS="$(date +"%Y%m%d_%H%M%S")"
ARCHIVE_NAME="uploads_${ENV_NAME}_${TS}.tar.gz"
OUTPUT_FILE="${BACKUP_DIR}/${ARCHIVE_NAME}"

echo "[backup-uploads] Starting uploads volume backup for '${ENV_NAME}'..."
echo "[backup-uploads] Target container: ${CONTAINER_NAME}"
echo "[backup-uploads] Archive file: ${OUTPUT_FILE}"

# 1. Pastikan folder uploads ada di dalam kontainer backend
docker exec "${CONTAINER_NAME}" mkdir -p /app/uploads

# 2. Buat arsip tar.gz langsung dari dalam kontainer dan stream ke file di VPS host
echo "[backup-uploads] Archiving /app/uploads from container..."
docker exec "${CONTAINER_NAME}" tar -czf - -C /app uploads > "${OUTPUT_FILE}"

if [ ! -s "${OUTPUT_FILE}" ]; then
  echo "::error::Backup archive ${OUTPUT_FILE} is empty or failed to create!"
  rm -f "${OUTPUT_FILE}"
  exit 1
fi

FILE_SIZE_KB="$(du -k "${OUTPUT_FILE}" | cut -f1)"
echo "[backup-uploads] Backup completed successfully: ${OUTPUT_FILE} (${FILE_SIZE_KB} KB)"

# 3. Rotasi backup lama (hanya untuk environment ini)
echo "[backup-uploads] Cleaning up old uploads backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "uploads_${ENV_NAME}_*.tar.gz" -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true

# 4. Output metadata untuk GitHub Actions
echo "OUTPUT_BACKUP_PATH=${OUTPUT_FILE}"
echo "OUTPUT_BACKUP_NAME=${ARCHIVE_NAME}"
echo "OUTPUT_BACKUP_SIZE_KB=${FILE_SIZE_KB}"
