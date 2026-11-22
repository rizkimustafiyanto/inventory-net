# 📖 Panduan Lengkap GitHub Secrets: Definisi, Contoh, & Cara Mendapatkannya

Dokumen ini memuat daftar seluruh **GitHub Secrets** yang diperlukan oleh sistem CI/CD, Deployment, Domain/SSL, dan Backup/Restore **InventoryNet Core**.

---

## 📋 Ringkasan & Checklist Seluruh Secrets

Semua secret di bawah ini diisi melalui GitHub repository Anda di:
👉 **Settings** $\rightarrow$ **Environments** (pilih **`production`** atau **`staging`**) $\rightarrow$ **Environment secrets**.

| No | Nama Secret | Sifat | Kategori | Contoh Nilai Singkat |
| :-: | :--- | :-: | :--- | :--- |
| 1 | `VPS_HOST` | **Wajib** | Akses Server | `103.123.45.67` |
| 2 | `VPS_USER` | **Wajib** | Akses Server | `ubuntu` atau `root` |
| 3 | `VPS_SSH_KEY` | **Wajib** | Akses Server | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| 4 | `VPS_PATH` | **Wajib** | Akses Server | `/opt/inventory_prod` |
| 5 | `CERTBOT_DOMAINS` | Opsional (Domain) | SSL & Nginx | `inventory.namadomain.com` |
| 6 | `CERTBOT_EMAIL` | Opsional (SSL) | SSL & Nginx | `developer@gmail.com` |
| 7 | `TELEGRAM_BOT_TOKEN` | Opsional (Notif) | Telegram Bot | `8764075501:AAH9qL9GEADnvJHTaGG7IxNNHm-_iRdhAA8` |
| 8 | `TELEGRAM_CHAT_ID` | Opsional (Notif) | Telegram Bot | `-5137288416` |
| 9 | `BACKEND_ENV` | **Wajib** | Konfigurasi App | *(Blok teks variabel .NET)* |
| 10 | `FRONTEND_ENV` | **Wajib** | Konfigurasi App | *(Blok teks variabel Next.js)* |

---

## 🖥️ 1. Kategori: Akses Server & VPS

### 1.1 `VPS_HOST`
* **Fungsi**: Alamat IP publik atau domain VPS tujuan tempat aplikasi di-deploy.
* **Contoh Nilai**:
  * Production: `103.186.32.105` (atau `vps.namadomain.com`)
  * Staging: `103.186.32.106` (atau `staging-vps.namadomain.com`)
* **Cara Mendapatkannya**:
  1. Login ke panel penyedia VPS Anda (misal: DigitalOcean, Linode, AWS EC2, Biznet Gio, IDCloudHost, Niagahoster, dll).
  2. Buka detail instance server Anda, salin **Public IPv4 Address**.
  3. Atau jalankan perintah ini di terminal VPS Anda:
     ```bash
     curl -s ifconfig.me
     ```

---

### 1.2 `VPS_USER`
* **Fungsi**: Username SSH di Linux server yang memiliki hak akses Docker dan sudo tanpa password prompt.
* **Contoh Nilai**:
  * `ubuntu` (Default jika menggunakan OS Ubuntu di AWS/DigitalOcean)
  * `root` (Default jika menggunakan VPS standalone / full root access)
  * `deployer` (Jika Anda membuat user non-root khusus CI/CD)
* **Cara Mendapatkannya**:
  * Cek user yang biasa Anda gunakan untuk SSH ke VPS.
  * Anda bisa mengeceknya di VPS dengan perintah:
    ```bash
    whoami
    ```

---

### 1.3 `VPS_SSH_KEY`
* **Fungsi**: Kunci privat SSH (*Private Key*) untuk otentikasi login dari GitHub Actions runner ke VPS tanpa password.
* **Contoh Format Nilai**:
  ```text
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
  QyNTUxOQAAACBA1... (teks panjang) ...
  -----END OPENSSH PRIVATE KEY-----
  ```
* **Cara Membuat & Mendapatkannya**:
  1. Buat pasangan SSH key khusus GitHub Actions di komputer Anda (atau di VPS):
     ```bash
     ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy
     ```
     *(Tekan Enter saat diminta passphrase agar key tidak terkunci sandi).*
  2. Perintah di atas menghasilkan 2 file:
     * `github_deploy` (**Private Key** $\rightarrow$ masukkan ke secret `VPS_SSH_KEY`).
     * `github_deploy.pub` (**Public Key** $\rightarrow$ pasang di VPS).
  3. Pasang Public Key ke VPS Anda agar server mengizinkan login:
     ```bash
     # Jalankan di terminal VPS Anda:
     mkdir -p ~/.ssh
     chmod 700 ~/.ssh
     echo "ISI_DARI_GITHUB_DEPLOY.PUB" >> ~/.ssh/authorized_keys
     chmod 600 ~/.ssh/authorized_keys
     ```
  4. Salin seluruh isi file private key (`cat ~/.ssh/github_deploy`) mulai dari `-----BEGIN...` sampai `-----END...` dan tempelkan ke secret `VPS_SSH_KEY`.

---

### 1.4 `VPS_PATH`
* **Fungsi**: Path direktori di dalam VPS tempat meletakkan file compose, env, log deployment, dan data backup.
* **Contoh Nilai**:
  * Production: `/opt/inventory_prod`
  * Staging: `/opt/inventory_staging`
* **Cara Menyiapkannya di VPS**:
  1. Login ke VPS via terminal, lalu buat foldernya dan beri hak milik ke user Anda:
     ```bash
     sudo mkdir -p /opt/inventory_prod /opt/inventory_staging
     sudo chown -R $USER:$USER /opt/inventory_prod /opt/inventory_staging
     ```
  2. Masukkan path tersebut (misal: `/opt/inventory_prod`) ke secret `VPS_PATH`.

---

## 🌐 2. Kategori: Domain & Otomasi SSL (Nginx & Certbot)

### 2.1 `CERTBOT_DOMAINS`
* **Fungsi**: Nama domain atau subdomain yang diarahkan ke VPS. Digunakan untuk otomatisasi konfigurasi Nginx dan penerbitan sertifikat SSL (HTTPS) oleh Certbot.
* **Contoh Nilai**:
  * Production (1 Domain): `inventory.namadomain.com`
  * Production (Multi-Domain): `namadomain.com www.namadomain.com`
  * Staging: `staging.namadomain.com`
* **Cara Mendapatkannya**:
  1. Buka dashboard tempat Anda mengelola domain (Cloudflare, Namecheap, Niagahoster, Rumahweb, dll).
  2. Buka menu **DNS Management** $\rightarrow$ Tambahkan **A Record**:
     * **Name**: `inventory` (atau `staging`)
     * **Target / IP**: Isi dengan alamat IP VPS Anda (`VPS_HOST`)
     * **TTL**: Auto / 3600
  3. Salin nama domain/subdomain lengkap tersebut ke secret ini.

---

### 2.2 `CERTBOT_EMAIL`
* **Fungsi**: Alamat email aktif untuk pendaftaran akun Let's Encrypt SSL. Digunakan untuk pengiriman notifikasi otomatis jika masa berlaku SSL mendekati kedaluwarsa.
* **Contoh Nilai**: `admin@namadomain.com` atau `emailpribadi@gmail.com`.
* **Cara Menentukannya**: Gunakan email pribadi atau tim pengembang yang selalu aktif dipantau.

---

## 🤖 3. Kategori: Notifikasi & File Backup Telegram Bot

### 3.1 `TELEGRAM_BOT_TOKEN`
* **Fungsi**: Token autentikasi API bot Telegram untuk mengirimkan file backup `.dmp.gz` dan status deployment ke chat/grup Telegram.
* **Contoh Nilai**: `8764075501:AAH9qL9GEADnvJHTaGG7IxNNHm-_iRdhAA8`
* **Cara Mendapatkannya**:
  1. Buka aplikasi Telegram, cari bot resmi **`@BotFather`**.
  2. Kirim perintah `/newbot`.
  3. Beri nama bot (misal: `Inventory Net Bot`), lalu beri username berakhiran bot (misal: `InventoryNet_bot`).
  4. BotFather akan memberikan teks **HTTP API token** (format: `123456789:ABCdefGhI...`). Salin teks tersebut.

---

### 3.2 `TELEGRAM_CHAT_ID`
* **Fungsi**: ID percakapan chat pribadi atau ID grup Telegram tempat bot mengirimkan pesan dan file backup.
* **Contoh Nilai**:
  * Untuk Grup Telegram: `-5137288416` (atau `-1005137288416`)
  * Untuk Chat Pribadi: `123456789`
* **Cara Mendapatkannya**:
  * **Jika ingin dikirim ke Grup**:
    1. Buat grup Telegram baru (atau gunakan grup yang sudah ada).
    2. Undang bot Anda ke dalam grup tersebut sebagai anggota.
    3. Undang bot **`@RawDataBot`** atau **`@userinfobot`** ke dalam grup tersebut sementara.
    4. Bot akan menampilkan JSON informasi grup. Salin angka pada kolom `chat.id` (biasanya diawali tanda minus `-` atau `-100`).
    5. Keluarkan `@RawDataBot` dari grup.
  * **Jika ingin dikirim ke Chat Pribadi**:
    1. Buka bot **`@userinfobot`**, klik **Start**.
    2. Salin angka di baris `Id:`.
    3. Buka bot Anda sendiri, lalu klik **Start** (wajib agar bot diizinkan mengirim pesan ke Anda).

---

## ⚙️ 4. Kategori: Konfigurasi Aplikasi (`BACKEND_ENV`)

Secret ini berisi seluruh teks konfigurasi `.env` untuk backend .NET Core saat berjalan di container VPS.

### A. Contoh Nilai untuk Environment: `production`
```env
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080

# String koneksi ke database Oracle container
ConnectionStrings__OracleConnection=Data Source=oracle:1521/FREEPDB1;User Id=inventory_user;Password=GantiDenganPasswordKuat123!;

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

Jwt__Key=INVENTORY_NET_STAGING_JWT_SECRET_KEY_2026_TEST_KEY_MUST_BE_LONG_AND_SECURE!
Jwt__Issuer=InventoryNetApi
Jwt__Audience=InventoryNetClient
```

> **💡 Tips Membuat Jwt__Key Acak yang Aman**:
> Anda bisa membuat string acak 64 karakter di terminal dengan perintah:
> ```bash
> openssl rand -base64 48
> ```

---

## 💻 5. Kategori: Konfigurasi Aplikasi (`FRONTEND_ENV`)

Secret ini berisi konfigurasi runtime Next.js frontend di VPS.

### A. Contoh Nilai untuk Environment: `production`
```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# URL Domain lengkap Anda (mengarah ke HTTPS)
NEXT_PUBLIC_API_BASE_URL=https://inventory.namadomain.com
```

### B. Contoh Nilai untuk Environment: `staging`
```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

NEXT_PUBLIC_API_BASE_URL=https://staging.namadomain.com
```

> **Catatan `NEXT_PUBLIC_API_BASE_URL`**:
> Karena Nginx di VPS sudah dikonfigurasi untuk me-reverse proxy rute `/api/` langsung ke backend port 8080, Anda cukup mengisi domain utama web Anda (misal `https://inventory.namadomain.com`). Browser pengguna akan otomatis memanggil `https://inventory.namadomain.com/api/...` secara aman tanpa kendala CORS.

---

## 🚀 6. Panduan Menambahkan Secret ke GitHub (Langkah Demi Langkah)

1. Buka browser $\rightarrow$ masuk ke repositori GitHub Anda.
2. Klik tab **Settings** (ikon gerigi di atas).
3. Di menu sebelah kiri, pilih **Environments**.
4. Klik tombol **New environment** $\rightarrow$ Beri nama `production` $\rightarrow$ Klik **Configure environment**.
5. Gulir ke bawah ke bagian **Environment secrets** $\rightarrow$ Klik **Add secret**.
6. Masukkan nama secret (misal: `VPS_HOST`) dan nilainya $\rightarrow$ Klik **Add secret**.
7. Ulangi untuk semua secret yang tercantum pada tabel di atas.
8. Buat environment kedua bernama `staging` dan masukkan secrets untuk staging dengan cara yang sama.
