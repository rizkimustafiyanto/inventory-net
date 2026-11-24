#!/usr/bin/env bash
set -euo pipefail

FRONTEND_PORT="${1:-3001}"
BACKEND_PORT="${2:-8081}"
DOMAIN="${3:-}"

echo "=========================================="
echo " [VERIFY] Running Post-Deployment Healthcheck"
echo " Target Ports: Frontend=${FRONTEND_PORT}, Backend=${BACKEND_PORT}"
echo " Domain: ${DOMAIN:-None (Localhost)}"
echo "=========================================="

# 1. Tunggu hingga service siap (maksimal 90 detik)
MAX_WAIT=90
PASSED=false

echo "[verify] Menunggu container siap merespon..."
for i in $(seq 1 "${MAX_WAIT}"); do
  # Cek apakah frontend dan backend port sudah merespon
  FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 3 "http://127.0.0.1:${FRONTEND_PORT}" || echo "000")
  BE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 3 "http://127.0.0.1:${BACKEND_PORT}/" || echo "000")

  if [ "${FE_STATUS}" != "000" ] && [ "${FE_STATUS}" != "502" ] && [ "${BE_STATUS}" != "000" ] && [ "${BE_STATUS}" != "502" ]; then
    echo "[verify] Service merespon normal! (Frontend HTTP ${FE_STATUS}, Backend HTTP ${BE_STATUS}) pada detik ke-${i}"
    PASSED=true
    break
  fi

  if [ $((i % 5)) -eq 0 ]; then
    echo "[verify] Menunggu service boot... (${i}/${MAX_WAIT} detik) [Frontend: ${FE_STATUS}, Backend: ${BE_STATUS}]"
  fi
  sleep 1
done

# 2. Jika setelah 60 detik masih gagal / 502, kumpulkan log diagnostic dan gagalkan workflow!
if [ "${PASSED}" != "true" ]; then
  echo "::error::[HEALTHCHECK FAILED] Deployment GAGAL! Layanan tidak merespon atau mengembalikan error setelah ${MAX_WAIT} detik."
  echo ""
  echo "=========================================="
  echo " DIAGNOSTIC: STATUS DOCKER CONTAINERS"
  echo "=========================================="
  docker ps -a
  echo ""
  echo "=========================================="
  echo " DIAGNOSTIC: LOG CONTAINER FRONTEND"
  echo "=========================================="
  docker logs --tail 40 $(docker ps -q -f name=frontend | head -1) 2>&1 || true
  echo ""
  echo "=========================================="
  echo " DIAGNOSTIC: LOG CONTAINER BACKEND"
  echo "=========================================="
  docker logs --tail 40 $(docker ps -q -f name=backend | head -1) 2>&1 || true
  echo ""
  echo "=========================================="
  echo " DIAGNOSTIC: NGINX ERROR LOG"
  echo "=========================================="
  sudo tail -n 30 /var/log/nginx/error.log 2>&1 || true
  echo "=========================================="
  exit 1
fi

# 3. Cek respon Nginx via Host Domain jika domain diset
if [ -n "${DOMAIN}" ]; then
  FIRST_DOMAIN=$(echo "${DOMAIN}" | awk '{print $1}')
  echo "[verify] Menguji respon Nginx Reverse Proxy via domain ${FIRST_DOMAIN}..."
  NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 5 -H "Host: ${FIRST_DOMAIN}" "http://127.0.0.1" || echo "000")
  echo "[verify] Respon Nginx: HTTP ${NGINX_STATUS}"
  if [ "${NGINX_STATUS}" = "502" ] || [ "${NGINX_STATUS}" = "000" ] || [ "${NGINX_STATUS}" = "504" ]; then
    echo "::error::[NGINX FAILED] Nginx mengembalikan HTTP ${NGINX_STATUS} (Bad Gateway / Unreachable) saat mengakses domain ${FIRST_DOMAIN}!"
    echo "--- Nginx Error Log ---"
    sudo tail -n 30 /var/log/nginx/error.log 2>&1 || true
    exit 1
  fi
fi

echo "[verify] Semua pemeriksaan kesehatan BERHASIL! Layanan siap digunakan."
