#!/usr/bin/env bash
set -euo pipefail

CERTBOT_DOMAINS="${1:-${CERTBOT_DOMAINS:-}}"
CERTBOT_EMAIL="${2:-${CERTBOT_EMAIL:-}}"

if [ -z "${CERTBOT_DOMAINS}" ]; then
  echo "[ssl] Domains not specified. Skipping SSL / Cloudflare Tunnel setup."
  exit 0
fi

# Jika Cloudflare Tunnel aktif di server, SSL ditangani otomatis oleh Cloudflare Edge.
# Sekaligus pastikan domain sudah masuk di config.yml dan (bila cert.pem tersedia) rute DNS CNAME-nya terdaftar.
if command -v cloudflared >/dev/null 2>&1 && systemctl is-active --quiet cloudflared; then
  echo "[cloudflare] Cloudflare Tunnel (cloudflared.service) terdeteksi AKTIF."
  echo "[cloudflare] Sertifikat SSL (Universal SSL) otomatis dikelola oleh Cloudflare Edge."

  CF_CONFIG="/etc/cloudflared/config.yml"
  if [ ! -f "${CF_CONFIG}" ] && [ -f "${HOME}/.cloudflared/config.yml" ]; then
    CF_CONFIG="${HOME}/.cloudflared/config.yml"
  fi

  if [ -f "${CF_CONFIG}" ]; then
    TUNNEL_ID=$(sudo grep -E '^\s*tunnel:' "${CF_CONFIG}" | head -n 1 | awk '{print $2}' | tr -d '\r' || true)
    CERT_PEM=""
    for candidate in "${HOME}/.cloudflared/cert.pem" "/etc/cloudflared/cert.pem" "/root/.cloudflared/cert.pem"; do
      if sudo test -f "${candidate}" 2>/dev/null; then
        CERT_PEM="${candidate}"
        break
      fi
    done

    CF_UPDATED=false
    for domain in ${CERTBOT_DOMAINS}; do
      if sudo grep -qE "hostname:[[:space:]]*${domain}([[:space:]]|$)" "${CF_CONFIG}"; then
        echo "[cloudflare] Hostname '${domain}' sudah terdaftar di ${CF_CONFIG}."
      else
        echo "[cloudflare] Menambahkan ingress '${domain}' -> http://127.0.0.1:80 ke ${CF_CONFIG}..."
        sudo cp "${CF_CONFIG}" "${CF_CONFIG}.bak"
        sudo awk -v host="${domain}" '
          !inserted && /^[[:space:]]*-[[:space:]]*service:[[:space:]]*http_status:/ {
            print "  - hostname: " host
            print "    service: http://127.0.0.1:80"
            inserted=1
          }
          { print }
          END {
            if (!inserted) {
              print "  - hostname: " host
              print "    service: http://127.0.0.1:80"
            }
          }
        ' "${CF_CONFIG}.bak" | sudo tee "${CF_CONFIG}" > /dev/null
        CF_UPDATED=true
      fi

      if [ -n "${TUNNEL_ID}" ] && [ -n "${CERT_PEM}" ]; then
        echo "[cloudflare] Menjalankan auto-route DNS CNAME untuk '${domain}' pada tunnel '${TUNNEL_ID}'..."
        sudo TUNNEL_ORIGIN_CERT="${CERT_PEM}" cloudflared tunnel route dns "${TUNNEL_ID}" "${domain}" 2>&1 || true
      else
        echo "[cloudflare] Info: cert.pem tidak ditemukan di VPS. Pastikan CNAME '${domain}' (atau wildcard '*.zyramuz.site' -> '${TUNNEL_ID:-<TUNNEL_ID>}.cfargotunnel.com') sudah terdaftar di Cloudflare Dashboard."
      fi
    done

    if [ "${CF_UPDATED}" = "true" ]; then
      echo "[cloudflare] Memvalidasi ${CF_CONFIG} dan me-restart cloudflared.service..."
      sudo cloudflared tunnel --config "${CF_CONFIG}" ingress validate 2>/dev/null || true
      sudo systemctl restart cloudflared
      sleep 2
      if systemctl is-active --quiet cloudflared; then
        echo "[cloudflare] cloudflared.service berhasil di-restart dan AKTIF."
      else
        echo "::error::[cloudflare] cloudflared.service gagal berjalan setelah update config! Mengembalikan backup config..."
        sudo mv "${CF_CONFIG}.bak" "${CF_CONFIG}"
        sudo systemctl restart cloudflared || true
        exit 1
      fi
    fi
  else
    echo "::warning::[cloudflare] File konfigurasi ${CF_CONFIG} tidak ditemukan. Lewati auto-ingress."
  fi

  echo "[cloudflare] Setup Cloudflare Tunnel selesai. Certbot dilewati secara aman."
  exit 0
fi

if [ -z "${CERTBOT_EMAIL}" ]; then
  echo "[certbot] Email not specified. Skipping Certbot SSL setup."
  exit 0
fi

echo "[certbot] Setting up SSL for domains: ${CERTBOT_DOMAINS}..."

# 1. Tunggu apt lock dilepas jika ada proses update background (maks 3 menit)
echo "[certbot] Memeriksa ketersediaan apt lock..."
for i in $(seq 1 18); do
  if ! sudo fuser /var/lib/apt/lists/lock /var/lib/dpkg/lock-frontend > /dev/null 2>&1; then
    echo "[certbot] apt lock tersedia."
    break
  fi
  echo "[certbot] apt masih terkunci, menunggu 10 detik... ($i/18)"
  sleep 10
done

# 2. Perbaiki mirror regional yang sering 403 / corrupt ke mirror resmi Ubuntu
sudo sed -i 's|http://id.archive.ubuntu.com/|http://archive.ubuntu.com/|g' /etc/apt/sources.list /etc/apt/sources.list.d/*.sources /etc/apt/sources.list.d/*.list 2>/dev/null || true

# 3. Install certbot dan certbot-nginx jika belum terpasang
if ! command -v certbot > /dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --fix-missing --no-install-recommends certbot python3-certbot-nginx
fi

# 4. Request / expand SSL Certificate
DOMAINS_ARG=$(printf -- '-d %s ' ${CERTBOT_DOMAINS})
if ! sudo certbot --nginx --non-interactive --agree-tos --keep-until-expiring \
  --expand -m "${CERTBOT_EMAIL}" ${DOMAINS_ARG}; then
  echo "::warning::[certbot] SSL certificate issuance gagal (wajar jika server di balik NAT / Tailscale tanpa port 80 publik). Nginx tetap melayani HTTP secara normal."
fi

sudo systemctl reload nginx || true
echo "[certbot] Selesai."
