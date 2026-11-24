#!/usr/bin/env bash
set -euo pipefail

BACKUP_FILE="${1:-}"
if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_uploads_backup.tar.gz>"
  exit 1
fi

VPS_PATH="${VPS_PATH:-/opt/inventory_net}"
CONTAINER_NAME="${CONTAINER_NAME:-inventory-backend}"

if [ ! -f "${BACKUP_FILE}" ]; then
  if [ -f "${VPS_PATH}/backups/${BACKUP_FILE}" ]; then
    BACKUP_FILE="${VPS_PATH}/backups/${BACKUP_FILE}"
  else
    echo "::error::Backup file not found at ${BACKUP_FILE} or ${VPS_PATH}/backups/${BACKUP_FILE}!"
    exit 1
  fi
fi

# Safety Guard: Cegah restore file backup Staging ke kontainer Production
if [[ "${CONTAINER_NAME}" == *"inventory-backend"* ]] && [[ "${CONTAINER_NAME}" != *"staging"* ]] && [[ "${BACKUP_FILE}" == *"staging"* ]]; then
  echo "::error::[SAFETY GUARD] DILARANG me-restore file uploads Staging ('${BACKUP_FILE}') ke kontainer Production ('${CONTAINER_NAME}')!"
  echo "Operasi ini dibatalkan secara otomatis untuk melindungi aset media produksi."
  exit 1
fi

echo "[restore-uploads] Preparing restore from: ${BACKUP_FILE}"
echo "[restore-uploads] Target container: ${CONTAINER_NAME}"

# 1. Pastikan folder /app ada di dalam kontainer
docker exec "${CONTAINER_NAME}" mkdir -p /app

# 2. Ekstrak arsip tar.gz ke dalam kontainer di path /app
echo "[restore-uploads] Extracting archive into ${CONTAINER_NAME}:/app..."
cat "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" tar -xzf - -C /app

# 3. Set izin folder uploads agar bisa dibaca dan ditulis oleh backend
docker exec "${CONTAINER_NAME}" chmod -R 775 /app/uploads || true

echo "=========================================="
echo " Uploads volume restore completed successfully at $(date)"
echo "=========================================="
