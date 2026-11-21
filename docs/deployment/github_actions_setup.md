# Panduan Setup GitHub Actions CI/CD (Staging & Production)

Dokumen ini menjelaskan alur kerja, isolasi, dan cara konfigurasi secrets untuk pipeline GitHub Actions pada project **InventoryNet Core**.

---

## 1. Ringkasan Workflow

| Workflow | File | Trigger | Tujuan |
| :--- | :--- | :--- | :--- |
| **CI** | `.github/workflows/ci.yml` | Otomatis pada `push` & `PR` ke branch `staging` & `main` | Menjalankan build & unit test .NET 8 (14 tests) dan lint/type-check/build Next.js 16 secara paralel. |
| **Deploy Staging** | `.github/workflows/deploy-staging.yml` | Otomatis pada `push` ke branch `staging` | Build image Docker `:staging` $\rightarrow$ Push ke GHCR $\rightarrow$ Auto Deploy via SSH ke VPS Staging. |
| **Deploy Production** | `.github/workflows/deploy.yml` | **Manual Only** (`workflow_dispatch`) | Hanya dijalankan saat developer mengklik tombol **"Run workflow"** di GitHub Actions untuk branch `main`. |

---

## 2. Jaminan Isolasi Antara Staging & Main

Pipeline ini menerapkan 5 lapis isolasi ketat:
1. **Branch Guard**: 
   - `deploy-staging.yml` hanya bisa dieksekusi jika `github.ref == 'refs/heads/staging'`.
   - `deploy.yml` hanya bisa dieksekusi jika `github.ref == 'refs/heads/main'` dan input teks bernilai `"deploy"`.
2. **GitHub Environments**:
   - Environment `staging` dan `production` dipisahkan di level GitHub Settings.
3. **Docker Image Tag (GHCR)**:
   - Staging: `ghcr.io/<owner>/inventory-backend:staging`
   - Production: `ghcr.io/<owner>/inventory-backend:latest` & `:<git-sha>`
4. **Kontainer & Jaringan Server**:
   - Staging: Container `inventory-staging-*`, volume `inventory_staging_oracle_data`, network `inventory_staging_network`.
   - Production: Container `inventory-*`, volume `inventory_oracle_data`, network `inventory_network`.
5. **Concurrency Group**:
   - Pipeline staging dan production memiliki queue terpisah sehingga tidak saling membatalkan (*cancel*).

---

## 3. Konfigurasi GitHub Repository & Environments

Masuk ke repository GitHub Anda $\rightarrow$ **Settings** $\rightarrow$ **Environments** $\rightarrow$ Buat 2 Environment:

### A. Environment: `staging`
Tambahkan Environment Secrets berikut:
* `VPS_HOST`: IP atau domain VPS Staging.
* `VPS_USER`: Username SSH VPS (misal: `ubuntu` atau `root`).
* `VPS_SSH_KEY`: Private SSH Key (format OpenSSH / ed25519) untuk login ke VPS.
* `VPS_PATH`: Direktori deployment di VPS (misal: `/opt/inventory_net_staging`).
* `BACKEND_ENV`: Isi konfigurasi environment backend staging (Oracle connection, JWT, ASPNETCORE_ENVIRONMENT=Staging).
* `FRONTEND_ENV`: Isi konfigurasi environment frontend staging (`NEXT_PUBLIC_API_BASE_URL`).

### B. Environment: `production`
Tambahkan Environment Secrets yang sama namun mengarah ke server / folder Production:
* `VPS_HOST`: IP atau domain VPS Production.
* `VPS_USER`: Username SSH VPS Production.
* `VPS_SSH_KEY`: Private SSH Key untuk VPS Production.
* `VPS_PATH`: Direktori deployment di VPS (misal: `/opt/inventory_net`).
* `BACKEND_ENV`: Konfigurasi backend production.
* `FRONTEND_ENV`: Konfigurasi frontend production.

---

## 4. Cara Menjalankan Rilis ke Production (Manual Gate)

1. Buka tab **Actions** di repositori GitHub Anda.
2. Di sidebar kiri, klik **"Deploy (Production VPS)"**.
3. Klik tombol dropdown **"Run workflow"** di sebelah kanan.
4. Pastikan pilihan branch adalah **`main`**.
5. Biarkan input konfirmasi bertuliskan **`deploy`**.
6. Klik tombol hijau **"Run workflow"**.
