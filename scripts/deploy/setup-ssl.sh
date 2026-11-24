#!/usr/bin/env bash
set -euo pipefail

CERTBOT_DOMAINS="${1:-${CERTBOT_DOMAINS:-}}"
CERTBOT_EMAIL="${2:-${CERTBOT_EMAIL:-}}"

if [ -z "${CERTBOT_DOMAINS}" ] || [ -z "${CERTBOT_EMAIL}" ]; then
  echo "[certbot] Domains or email not specified. Skipping SSL setup."
  exit 0
fi

# Jika Cloudflare Tunnel aktif di server, SSL ditangani otomatis oleh Cloudflare Edge.
if command -v cloudflared >/dev/null 2>&1 && systemctl is-active --quiet cloudflared; then
  echo "[certbot] Cloudflare Tunnel (cloudflared.service) terdeteksi AKTIF."
  echo "[certbot] Sertifikat SSL (Universal SSL) otomatis dikelola oleh Cloudflare Edge untuk domain: ${CERTBOT_DOMAINS}."
  echo "[certbot] Certbot (Let's Encrypt HTTP-01) dilewati secara aman."
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
