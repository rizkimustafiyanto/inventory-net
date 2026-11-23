# Panduan Lengkap GitHub Secrets & Konfigurasi Domain

Dokumen ini adalah panduan lengkap cara mengisi secret di GitHub repository untuk rilis otomatis ke **Staging**, **Production**, proteksi port bentrok, serta integrasi notifikasi/file backup ke **Bot Telegram**.

---

## 1. Lokasi Pengisian di GitHub

1. Buka repositori Anda di GitHub.
2. Klik tab **Settings** $\rightarrow$ **Environments** (di menu sebelah kiri).
3. Buat 2 Environment jika belum ada:
   * **`staging`**
   * **`production`**
4. Masuk ke masing-masing environment, lalu tambahkan secrets pada bagian **Environment secrets**.

---

## 2. Daftar Secrets per Environment

### A. Environment `staging`

| Nama Secret | Wajib/Opsional | Nilai / Contoh | Keterangan |
| :--- | :---: | :--- | :--- |
| `VPS_HOST` | **Wajib** | `103.xxx.xxx.xxx` atau `staging.domainanda.com` | Alamat IP atau domain VPS Staging. |
| `VPS_USER` | **Wajib** | `ubuntu` atau `root` | Username SSH untuk login ke VPS. |
| `VPS_SSH_KEY` | **Wajib** | `-----BEGIN OPENSSH PRIVATE KEY----- ...` | Private SSH key yang terdaftar di VPS (`~/.ssh/authorized_keys`). |
| `VPS_PATH` | **Wajib** | `/opt/inventory_staging` | Lokasi folder kerja di VPS untuk staging. |
| `FRONTEND_PORT` | Opsional | `3001` (Default) | Port host Next.js frontend di VPS. |
| `BACKEND_PORT` | Opsional | `8081` (Default) | Port host .NET backend di VPS. |
| `ORACLE_PORT` | Opsional | `1522` (Default) | Port host Oracle database listener di VPS. |
| `BACKEND_ENV` | **Wajib** | *(Lihat contoh template staging di bawah)* | Seluruh isi file `.env` backend staging. |
| `FRONTEND_ENV` | **Wajib** | *(Lihat contoh template staging di bawah)* | Seluruh isi file `.env` frontend staging. |
| `CERTBOT_DOMAINS` | **Opsional (Domain)** | `staging.domainanda.com` | Nama domain staging Anda (pisahkan spasi jika lebih dari satu). |
| `CERTBOT_EMAIL` | **Opsional (SSL)** | `emailanda@gmail.com` | Email untuk pendaftaran SSL gratis Let's Encrypt. |
| `TELEGRAM_BOT_TOKEN` | **Opsional (Notif/Backup)**| `8764075501:AAH9qL........` | Token bot dari @BotFather. |
| `TELEGRAM_CHAT_ID` | **Opsional (Notif/Backup)**| `-5137288416` | Chat ID Telegram grup "TEST". |
| `TAILSCALE_AUTHKEY` | **Wajib (Jika Home Server/Tailscale)** | `tskey-auth-...` | Auth key Tailscale untuk menghubungkan GitHub Actions ke server. |

---

### B. Environment `production`

| Nama Secret | Wajib/Opsional | Nilai / Contoh | Keterangan |
| :--- | :---: | :--- | :--- |
| `VPS_HOST` | **Wajib** | `103.xxx.xxx.xxx` atau `domainanda.com` | Alamat IP atau domain VPS Production. |
| `VPS_USER` | **Wajib** | `ubuntu` atau `root` | Username SSH untuk login ke VPS. |
| `VPS_SSH_KEY` | **Wajib** | `-----BEGIN OPENSSH PRIVATE KEY----- ...` | Private SSH key untuk VPS Production. |
| `VPS_PATH` | **Wajib** | `/opt/inventory_prod` | Lokasi folder kerja di VPS untuk production. |
| `FRONTEND_PORT` | Opsional | `3000` (Default) | Port host Next.js frontend di VPS. |
| `BACKEND_PORT` | Opsional | `8080` (Default) | Port host .NET backend di VPS. |
| `ORACLE_PORT` | Opsional | `1521` (Default) | Port host Oracle database listener di VPS. |
| `BACKEND_ENV` | **Wajib** | *(Lihat contoh template production di bawah)* | Seluruh isi file `.env` backend production. |
| `FRONTEND_ENV` | **Wajib** | *(Lihat contoh template production di bawah)* | Seluruh isi file `.env` frontend production. |
| `CERTBOT_DOMAINS` | **Opsional (Domain)** | `domainanda.com www.domainanda.com` | Nama domain production Anda. |
| `CERTBOT_EMAIL` | **Opsional (SSL)** | `emailanda@gmail.com` | Email pemilik domain untuk auto-SSL. |
| `TELEGRAM_BOT_TOKEN` | **Opsional (Notif/Backup)**| `8764075501:AAH9qL........` | Token bot dari @BotFather. |
| `TELEGRAM_CHAT_ID` | **Opsional (Notif/Backup)**| `-5137288416` | Chat ID Telegram grup "TEST". |
| `TAILSCALE_AUTHKEY` | **Wajib (Jika Home Server/Tailscale)** | `tskey-auth-...` | Auth key Tailscale untuk menghubungkan GitHub Actions ke server. |

---

## 3. Fitur Proteksi Port Bentrok (Port Collision Auto-Abort)

Jika Staging dan Production berada di **1 VPS yang sama**:
* **Pemisahan Default**: Production (`3000, 8080, 1521`) vs Staging (`3001, 8081, 1522`).
* **Pengecekan Otomatis**: Script `deploy-remote.sh` akan memverifikasi apakah port sedang dipakai oleh service lain sebelum melakukan deployment.
* **Auto-Abort**: Jika port dipakai oleh container lain atau proses native host, deployment akan **otomatis dibatalkan** demi keamanan service yang sedang berjalan.
* **Notifikasi Telegram**: Peringatan kegagalan/abort akan langsung dikirim ke grup Telegram dengan status `❌ [DEPLOYMENT GAGAL / ABORT]`.

---

## 4. Template Isi File Environment (Copy-Paste ke Secret)

### Untuk Secret: `BACKEND_ENV` (Production)
```env
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__OracleConnection=Data Source=oracle:1521/FREEPDB1;User Id=inventory_user;Password=GANTI_DENGAN_PASSWORD_DATABASE_PRODUCTION_ANDA;
Jwt__Key=INVENTORY_NET_ULTRA_SECURE_JWT_SECRET_KEY_PRODUCTION_2026_CHANGE_THIS_KEY_NOW!
Jwt__Issuer=InventoryNetApi
Jwt__Audience=InventoryNetClient
```

### Untuk Secret: `FRONTEND_ENV` (Production)
```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_API_BASE_URL=https://domainanda.com
```

---

### Untuk Secret: `BACKEND_ENV` (Staging)
```env
ASPNETCORE_ENVIRONMENT=Staging
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__OracleConnection=Data Source=oracle:1521/FREEPDB1;User Id=inventory_user;Password=GANTI_DENGAN_PASSWORD_DATABASE_STAGING_ANDA;
Jwt__Key=INVENTORY_NET_STAGING_JWT_SECRET_KEY_2026_TEST_KEY_MUST_BE_LONG_AND_SECURE!
Jwt__Issuer=InventoryNetApi
Jwt__Audience=InventoryNetClient
```

### Untuk Secret: `FRONTEND_ENV` (Staging)
```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_API_BASE_URL=https://staging.domainanda.com
```
