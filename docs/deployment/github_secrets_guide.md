# 📖 Panduan Lengkap GitHub Secrets: Definisi, Contoh, & Cara Mendapatkannya

Dokumen ini memuat daftar seluruh **GitHub Secrets** yang diperlukan oleh sistem CI/CD, Deployment, Domain/SSL, Proteksi Port Bentrok, dan Backup/Restore **InventoryNet Core**.

---

## 📋 Ringkasan & Checklist Seluruh Secrets

Semua secret di bawah ini diisi melalui GitHub repository Anda di:
👉 **Settings** $\rightarrow$ **Environments** (pilih **`production`** atau **`staging`**) $\rightarrow$ **Environment secrets**.

| No | Nama Secret | Sifat | Kategori | Contoh Nilai (Prod) | Contoh Nilai (Staging) |
| :-: | :--- | :-: | :--- | :--- | :--- |
| 1 | `VPS_HOST` | **Wajib** | Akses Server | `103.123.45.67` | `103.123.45.67` |
| 2 | `VPS_USER` | **Wajib** | Akses Server | `ubuntu` atau `root` | `ubuntu` atau `root` |
| 3 | `VPS_SSH_KEY` | **Wajib** | Akses Server | `-----BEGIN OPENSSH ...` | `-----BEGIN OPENSSH ...` |
| 4 | `VPS_PATH` | **Wajib** | Akses Server | `/opt/inventory_prod` | `/opt/inventory_staging` |
| 5 | `FRONTEND_PORT` | Opsional (Default) | Port Mapping | `3000` | `3001` |
| 6 | `BACKEND_PORT` | Opsional (Default) | Port Mapping | `8080` | `8081` |
| 7 | `ORACLE_PORT` | Opsional (Default) | Port Mapping | `1521` | `1522` |
| 8 | `APP_DOMAIN` / `CERTBOT_DOMAINS` | Opsional (Domain) | Cloudflare & Nginx | `net.zyramuz.site` | `stg-net.zyramuz.site` |
| 9 | `CERTBOT_EMAIL` | Opsional (SSL) | SSL & Nginx *(dilewati jika pakai Cloudflare Tunnel)* | `emailanda@gmail.com` | `emailanda@gmail.com` |
| 10 | `TELEGRAM_BOT_TOKEN` | Opsional (Notif) | Telegram Bot | `1234567890:AAH...` | `1234567890:AAH...` |
| 11 | `TELEGRAM_CHAT_ID` | Opsional (Notif) | Telegram Bot | `-1001234567890` | `-1001234567890` |
| 12 | `BACKEND_ENV` | **Wajib** | Konfigurasi App | *(Blok teks variabel .NET)* | *(Blok teks variabel .NET)* |
| 13 | `FRONTEND_ENV` | **Wajib** | Konfigurasi App | *(Blok teks variabel Next.js)* | *(Blok teks variabel Next.js)* |
| 14 | `TAILSCALE_AUTHKEY` | **Wajib (Jika Home Server/Tailscale)** | Akses Tailnet | `tskey-auth-...` | `tskey-auth-...` |

---

## 🛡️ 1. Mekanisme Proteksi Port Bentrok di 1 VPS yang Sama (Collision Auto-Abort)

Jika Staging dan Production berada di **1 VPS fisik yang sama**:
1. **Pemisahan Port Default Otomatis**:
   * **Production**: Frontend=`3000`, Backend=`8080`, Oracle=`1521`
   * **Staging**: Frontend=`3001`, Backend=`8081`, Oracle=`1522`
   *(Anda juga bisa mengubah port tersebut kapan saja via secret `FRONTEND_PORT`, `BACKEND_PORT`, dan `ORACLE_PORT`).*

2. **Deteksi Bentrok & Otomatis Batal (Abort)**:
   * Sebelum Docker Compose dijalankan, script `deploy-remote.sh` akan memindai apakah port tujuan sedang digunakan oleh service lain.
   * **Jika port dipakai oleh service lain / non-docker**: Deployment akan **LANGSUNG DIBATALKAN (ABORT)** demi keselamatan service yang sedang aktif!
   * **Jika port dipakai oleh container service itu sendiri**: Diizinkan lewat (*Aman untuk update/recreate*).
   * **Notifikasi Telegram**: Jika terjadi bentrok port dan dibatalkan, bot Telegram akan langsung mengirimkan peringatan **❌ [DEPLOYMENT GAGAL / ABORT]** lengkap dengan detail port yang bentrok.

---

## 🖥️ 2. Kategori: Akses Server & VPS

### 2.1 `VPS_HOST`
* **Fungsi**: Alamat IP publik atau domain VPS tujuan tempat aplikasi di-deploy.
* **Contoh Nilai**:
  * Production: `103.186.32.105` (atau `vps.namadomain.com`)
  * Staging: `103.186.32.106` (atau sama jika 1 VPS: `103.186.32.105`)
* **Cara Mendapatkannya**:
  1. Login ke panel penyedia VPS Anda (DigitalOcean, AWS, Biznet Gio, IDCloudHost, Niagahoster, dll).
  2. Buka detail instance server Anda, salin **Public IPv4 Address**.
  3. Atau jalankan perintah ini di terminal VPS Anda:
     ```bash
     curl -s ifconfig.me
     ```

---

### 2.2 `VPS_USER`
* **Fungsi**: Username SSH di Linux server yang memiliki hak akses Docker dan sudo tanpa password prompt.
* **Contoh Nilai**: `ubuntu` atau `root` atau `deployer`.
* **Cara Mendapatkannya**: Cek user yang biasa Anda gunakan untuk SSH ke VPS (`whoami`).

---

### 2.3 `VPS_SSH_KEY`
* **Fungsi**: Kunci privat SSH (*Private Key*) untuk otentikasi login dari GitHub Actions runner ke VPS tanpa password.
* **Contoh Format Nilai**:
  ```text
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
  ...
  -----END OPENSSH PRIVATE KEY-----
  ```
* **Cara Membuat & Mendapatkannya**:
  1. Buat pasangan SSH key di terminal:
     ```bash
     ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy
     ```
     *(Tekan Enter saat diminta passphrase agar key tidak terkunci sandi).*
  2. Pasang Public Key (`github_deploy.pub`) ke VPS Anda:
     ```bash
     mkdir -p ~/.ssh && chmod 700 ~/.ssh
     echo "ISI_DARI_GITHUB_DEPLOY.PUB" >> ~/.ssh/authorized_keys
     chmod 600 ~/.ssh/authorized_keys
     ```
  3. Salin seluruh isi file private key (`cat ~/.ssh/github_deploy`) mulai dari `-----BEGIN...` sampai `-----END...` dan tempelkan ke secret `VPS_SSH_KEY`.

---

### 2.4 `VPS_PATH`
* **Fungsi**: Path direktori kerja di VPS untuk meletakkan file compose, env, log deployment, dan data backup.
* **Contoh Nilai**:
  * Production: `/opt/inventory_prod`
  * Staging: `/opt/inventory_staging`
* **Cara Menyiapkannya di VPS**:
  Direktori `VPS_PATH` sekarang **otomatis dibuat dan diatur kepemilikannya (`sudo mkdir -p` + `sudo chown -R`) oleh workflow saat deploy pertama kali**, sehingga Anda tidak perlu login ke server untuk membuatnya secara manual untuk project baru *(pastikan saja `VPS_USER` memiliki akses `sudo` tanpa password)*.

---

## 🔌 3. Kategori: Port Customization (Opsional)

Jika tidak diisi di GitHub Secrets, sistem akan otomatis menggunakan nilai default yang aman. Anda hanya perlu mengisinya jika ingin menentukan port custom sendiri.

| Secret Name | Default Prod | Default Staging | Keterangan |
| :--- | :---: | :---: | :--- |
| **`FRONTEND_PORT`** | `3000` | `3001` | Port host VPS untuk Next.js Frontend |
| **`BACKEND_PORT`** | `8080` | `8081` | Port host VPS untuk .NET Core Backend |
| **`ORACLE_PORT`** | `1521` | `1522` | Port host VPS untuk Oracle Database Listener |

> **Catatan Nginx**: Nginx akan otomatis menyesuaikan rute proxy ke port yang Anda tentukan di secret ini tanpa perlu ubah file manual!

---

## 🌐 4. Kategori: Domain & Otomasi SSL (Cloudflare Tunnel / Nginx)

### 4.1 `APP_DOMAIN` atau `CERTBOT_DOMAINS`
* **Fungsi**: Nama domain atau subdomain yang diarahkan ke server untuk konfigurasi `server_name` Nginx dan pengecekan Cloudflare Tunnel.
* **Contoh Nilai**:
  * Production: `net.zyramuz.site`
  * Staging: `stg-net.zyramuz.site`

### 4.2 `CERTBOT_EMAIL`
* **Fungsi**: Alamat email aktif untuk pendaftaran akun Let's Encrypt SSL (hanya dipakai jika tidak menggunakan Cloudflare Tunnel; jika `cloudflared` aktif, Certbot dilewati otomatis karena SSL ditangani di Cloudflare Edge).
* **Contoh Nilai**: `admin@namadomain.com` atau `emailpribadi@gmail.com`.

---

## 🤖 5. Kategori: Notifikasi & File Backup Telegram Bot

### 5.1 `TELEGRAM_BOT_TOKEN`
* **Fungsi**: Token autentikasi API bot Telegram.
* **Contoh Nilai**: `1234567890:AAH...`
* **Cara Mendapatkannya**: Dari bot resmi `@BotFather` via perintah `/newbot`.

### 5.2 `TELEGRAM_CHAT_ID`
* **Fungsi**: ID percakapan chat pribadi atau grup tujuan pengiriman notifikasi dan file backup.
* **Contoh Nilai**: `-1001234567890`
* **Cara Mendapatkannya**: Undang bot `@userinfobot` atau `@RawDataBot` ke dalam grup Anda untuk melihat baris `Id:`.

---

## ⚙️ 6. Kategori: Konfigurasi Aplikasi (`BACKEND_ENV`)

### A. Contoh Nilai untuk Environment: `production`
```env
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080

# String koneksi ke database Oracle & Redis container
ConnectionStrings__OracleConnection=Data Source=oracle:1521/FREEPDB1;User Id=inventory_user;Password=GantiDenganPasswordKuat123!;
REDIS_PASSWORD=GantiPasswordRedisProd123!
ConnectionStrings__Redis=redis:6379,password=GantiPasswordRedisProd123!

# Kunci rahasia enkripsi JWT (Minimal 64 karakter acak)
Jwt__Key=INVENTORY_NET_ULTRA_SECURE_JWT_SECRET_KEY_PRODUCTION_2026_CHANGE_THIS_KEY_NOW!
Jwt__Issuer=InventoryNetApi
Jwt__Audience=InventoryNetClient
```

### B. Contoh Nilai untuk Environment: `staging`
```env
ASPNETCORE_ENVIRONMENT=Staging
ASPNETCORE_URLS=http://+:8080

ConnectionStrings__OracleConnection=Data Source=oracle:1521/FREEPDB1;User Id=inventory_user;Password=GantiPasswordStaging123!;
REDIS_PASSWORD=GantiPasswordRedisStaging123!
ConnectionStrings__Redis=redis:6379,password=GantiPasswordRedisStaging123!

Jwt__Key=INVENTORY_NET_STAGING_JWT_SECRET_KEY_2026_TEST_KEY_MUST_BE_LONG_AND_SECURE!
Jwt__Issuer=InventoryNetApi
Jwt__Audience=InventoryNetClient
```

---

## 💻 7. Kategori: Konfigurasi Aplikasi (`FRONTEND_ENV`)

### A. Contoh Nilai untuk Environment: `production`
```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# URL Domain lengkap Anda
NEXT_PUBLIC_API_BASE_URL=https://inventory.namadomain.com
```

### B. Contoh Nilai untuk Environment: `staging`
```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

NEXT_PUBLIC_API_BASE_URL=https://staging.namadomain.com
```

---

## 🚀 8. Panduan Menambahkan Secret ke GitHub (Step-by-Step)

1. Buka browser $\rightarrow$ masuk ke repositori GitHub Anda.
2. Klik tab **Settings** (ikon gerigi).
3. Di menu sebelah kiri, pilih **Environments**.
4. Buat 2 Environment jika belum ada:
   * **`production`**
   * **`staging`**
5. Masuk ke masing-masing environment $\rightarrow$ klik **Add secret** (serta kunci **Deployment branches** sesuai panduan di [`github_actions_setup.md`](./github_actions_setup.md)).
6. Masukkan nama secret dan nilainya sesuai tabel di atas.
