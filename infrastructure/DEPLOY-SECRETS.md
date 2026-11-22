# Panduan Lengkap GitHub Secrets & Konfigurasi Domain

Dokumen ini adalah panduan lengkap cara mengisi secret di GitHub repository untuk rilis otomatis ke **Staging**, **Production**, serta integrasi notifikasi/file backup ke **Bot Telegram**.

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
| `BACKEND_ENV` | **Wajib** | *(Lihat contoh template staging di bawah)* | Seluruh isi file `.env` backend staging. |
| `FRONTEND_ENV` | **Wajib** | *(Lihat contoh template staging di bawah)* | Seluruh isi file `.env` frontend staging. |
| `CERTBOT_DOMAINS` | **Opsional (Domain)** | `staging.domainanda.com` | Nama domain staging Anda (pisahkan spasi jika lebih dari satu). |
| `CERTBOT_EMAIL` | **Opsional (SSL)** | `emailanda@gmail.com` | Email untuk pendaftaran SSL gratis Let's Encrypt. |
| `TELEGRAM_BOT_TOKEN` | **Opsional (Notif/Backup)**| `123456789:ABCdefGhI...` | Token bot dari @BotFather untuk menerima file backup & notifikasi. |
| `TELEGRAM_CHAT_ID` | **Opsional (Notif/Backup)**| `12345678` atau `-100xxxxxxx` | Chat ID Telegram pribadi atau grup tujuan pengiriman backup. |

---

### B. Environment `production`

| Nama Secret | Wajib/Opsional | Nilai / Contoh | Keterangan |
| :--- | :---: | :--- | :--- |
| `VPS_HOST` | **Wajib** | `103.xxx.xxx.xxx` atau `domainanda.com` | Alamat IP atau domain VPS Production. |
| `VPS_USER` | **Wajib** | `ubuntu` atau `root` | Username SSH untuk login ke VPS. |
| `VPS_SSH_KEY` | **Wajib** | `-----BEGIN OPENSSH PRIVATE KEY----- ...` | Private SSH key untuk VPS Production. |
| `VPS_PATH` | **Wajib** | `/opt/inventory_prod` | Lokasi folder kerja di VPS untuk production. |
| `BACKEND_ENV` | **Wajib** | *(Lihat contoh template production di bawah)* | Seluruh isi file `.env` backend production. |
| `FRONTEND_ENV` | **Wajib** | *(Lihat contoh template production di bawah)* | Seluruh isi file `.env` frontend production. |
| `CERTBOT_DOMAINS` | **Opsional (Domain)** | `domainanda.com www.domainanda.com` | Nama domain production Anda. |
| `CERTBOT_EMAIL` | **Opsional (SSL)** | `emailanda@gmail.com` | Email pemilik domain untuk auto-SSL. |
| `TELEGRAM_BOT_TOKEN` | **Opsional (Notif/Backup)**| `123456789:ABCdefGhI...` | Token bot dari @BotFather. |
| `TELEGRAM_CHAT_ID` | **Opsional (Notif/Backup)**| `12345678` atau `-100xxxxxxx` | Chat ID Telegram tujuan pengiriman file backup. |

---

## 3. Cara Mendapatkan Token & Chat ID Telegram

### Langkah 1: Buat Bot Baru
1. Buka aplikasi Telegram, cari bot resmi **`@BotFather`**.
2. Kirim pesan `/newbot`.
3. Ikuti instruksi (masukkan nama bot dan username berakhiran `bot`, misal `MyInventoryBackupBot`).
4. `@BotFather` akan memberikan **HTTP API token** (contoh: `7123456789:AAH...`).
   👉 Salin token ini ke secret **`TELEGRAM_BOT_TOKEN`**.

### Langkah 2: Dapatkan Chat ID Anda
1. Di Telegram, cari bot **`@userinfobot`** (atau `@RawDataBot`).
2. Klik **Start** / kirim pesan apa saja.
3. Bot akan membalas dengan info profil Anda, cari angka di baris `Id:` (contoh: `123456789`).
   *(Jika ingin ke grup: masukkan bot Anda ke grup, jadikan admin, lalu ambil ID grupnya).*
   👉 Salin ID ini ke secret **`TELEGRAM_CHAT_ID`**.
4. **PENTING**: Buka chat dengan bot baru Anda dan klik tombol **Start** agar bot memiliki izin untuk mengirimkan pesan ke Anda.

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

---

## 5. Menjalankan Backup & Restore Database

### A. Backup Otomatis
* Berjalan otomatis setiap hari pukul **02:00 WIB** tengah malam (`cron: '0 19 * * *'`).
* Hasil backup langsung dikirim ke Bot Telegram dan diunggah ke tab Artifacts GitHub Actions (tersimpan 90 hari).

### B. Backup Manual
1. Buka tab **Actions** di GitHub $\rightarrow$ pilih **"Database Backup"**.
2. Klik tombol **"Run workflow"** $\rightarrow$ pilih environment (`production` atau `staging`) $\rightarrow$ klik **Run workflow**.

### C. Restore Database
1. Buka tab **Actions** di GitHub $\rightarrow$ pilih **"Database Restore"**.
2. Klik tombol **"Run workflow"**:
   - Pilih target environment (misal `staging`).
   - Masukkan nama file backup yang ada di VPS (contoh: `backup_production_20261122_020015.dmp.gz`).
   - Ketik input teks konfirmasi: `RESTORE-CONFIRM`.
3. Klik **Run workflow**.
