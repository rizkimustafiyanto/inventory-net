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
  # Ambil status HTTP murni (3 digit)
  FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 3 "http://127.0.0.1:${FRONTEND_PORT}" 2>/dev/null || true)
  BE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 3 "http://127.0.0.1:${BACKEND_PORT}/" 2>/dev/null || true)

  # Bersihkan whitespace jika ada
  FE_STATUS="${FE_STATUS//[[:space:]]/}"
  BE_STATUS="${BE_STATUS//[[:space:]]/}"

  # Fallback ke 000 jika kosong
  FE_STATUS="${FE_STATUS:-000}"
  BE_STATUS="${BE_STATUS:-000}"

  # Hanya nyatakan berhasil jika kedua HTTP code valid (200, 301, 302, 304, 307, 308)
  if [[ "${FE_STATUS}" =~ ^(200|301|302|304|307|308)$ ]] && [[ "${BE_STATUS}" =~ ^(200|301|302|304|307|308)$ ]]; then
    echo "[verify] Kedua service telah AKTIF dan merespon normal! (Frontend HTTP ${FE_STATUS}, Backend HTTP ${BE_STATUS}) pada detik ke-${i}"
    PASSED=true
    break
  fi

  if [ $((i % 5)) -eq 0 ]; then
    echo "[verify] Menunggu service boot... (${i}/${MAX_WAIT} detik) [Frontend: ${FE_STATUS}, Backend: ${BE_STATUS}]"
  fi
  sleep 1
done

# 2. Jika setelah 90 detik masih gagal / 502, kumpulkan log diagnostic dan gagalkan workflow!
if [ "${PASSED}" != "true" ]; then
  echo "::error::[HEALTHCHECK FAILED] Deployment GAGAL! Layanan tidak merespon HTTP 200 setelah ${MAX_WAIT} detik (Frontend: ${FE_STATUS}, Backend: ${BE_STATUS})."
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
  NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 5 -H "Host: ${FIRST_DOMAIN}" "http://127.0.0.1" 2>/dev/null || true)
  NGINX_STATUS="${NGINX_STATUS//[[:space:]]/}"
  NGINX_STATUS="${NGINX_STATUS:-000}"
  echo "[verify] Respon Nginx: HTTP ${NGINX_STATUS}"
  if [[ ! "${NGINX_STATUS}" =~ ^(200|301|302|304|307|308)$ ]]; then
    echo "::error::[NGINX FAILED] Nginx mengembalikan HTTP ${NGINX_STATUS} (Bad Gateway / Unreachable) saat mengakses domain ${FIRST_DOMAIN}!"
    echo "=========================================="
    echo " DIAGNOSTIC: STATUS DOCKER CONTAINERS"
    echo "=========================================="
    docker ps -a
    echo "=========================================="
    echo " DIAGNOSTIC: LOG CONTAINER FRONTEND"
    echo "=========================================="
    docker logs --tail 40 $(docker ps -q -f name=frontend | head -1) 2>&1 || true
    echo "=========================================="
    echo " DIAGNOSTIC: NGINX ERROR LOG"
    echo "=========================================="
    sudo tail -n 30 /var/log/nginx/error.log 2>&1 || true
    exit 1
  fi
fi

# 4. Cek dan Jaga Ketersediaan Cloudflare Tunnel (cloudflared)
if [ -n "${DOMAIN}" ]; then
  FIRST_DOMAIN=$(echo "${DOMAIN}" | awk '{print $1}')
  echo "[verify] Memeriksa status Cloudflare Tunnel untuk domain ${FIRST_DOMAIN}..."

  if command -v cloudflared >/dev/null 2>&1; then
    # Cek apakah service systemd cloudflared aktif
    if systemctl is-active --quiet cloudflared; then
      echo "[verify] Cloudflare Tunnel service (cloudflared.service) AKTIF dan BERJALAN."
    else
      echo "::warning::[verify] cloudflared.service terpasang namun TIDAK AKTIF! Mencoba me-restart..."
      sudo systemctl restart cloudflared 2>/dev/null || true
      sleep 2
      if systemctl is-active --quiet cloudflared; then
        echo "[verify] cloudflared.service berhasil diaktifkan kembali."
      else
        echo "::error::[CLOUDFLARE TUNNEL DOWN] cloudflared.service gagal berjalan! Akses publik melalui domain ${FIRST_DOMAIN} akan terputus."
        exit 1
      fi
    fi

    # Cek apakah domain terdaftar di config.yml
    CF_CONFIG="/etc/cloudflared/config.yml"
    if [ ! -f "${CF_CONFIG}" ]; then
      CF_CONFIG="${HOME}/.cloudflared/config.yml"
    fi
    if [ -f "${CF_CONFIG}" ]; then
      if grep -q "${FIRST_DOMAIN}" "${CF_CONFIG}" 2>/dev/null; then
        echo "[verify] Domain ${FIRST_DOMAIN} terkonfigurasi dengan benar di ingress rule (${CF_CONFIG})."
      else
        echo "::warning::[CLOUDFLARE CONFIG MISSING] Domain ${FIRST_DOMAIN} belum terdaftar di ${CF_CONFIG}!"
        echo "Tambahkan domain ke ingress rule di ${CF_CONFIG} dan jalankan: sudo systemctl restart cloudflared"
      fi
    else
      echo "::warning::[CLOUDFLARE CONFIG MISSING] File konfigurasi /etc/cloudflared/config.yml tidak ditemukan!"
    fi
  else
    echo "::warning::[verify] cloudflared binary belum terpasang di host server. Lewati pengecekan tunnel."
  fi
fi

echo "[verify] Semua pemeriksaan kesehatan BERHASIL! Layanan siap digunakan."
