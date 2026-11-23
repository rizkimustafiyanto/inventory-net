# Panduan Setup GitHub Actions CI/CD (Staging & Production)

Dokumen ini menjelaskan seluruh pipeline GitHub Actions pada project **InventoryNet Core**, mencakup CI/CD, deployment VPS, domain Nginx SSL, serta backup/restore database dengan integrasi Telegram Bot.

---

## 1. Ringkasan Seluruh Workflow

| Workflow | File | Trigger | Tujuan |
| :--- | :--- | :--- | :--- |
| **CI** | `.github/workflows/ci.yml` | `PR` ke `staging` & `main`, serta `push` ke `main` | Menjalankan build & unit test .NET 8 (14 tests) dan lint/type-check/build Next.js 16 secara paralel. |
| **Deploy Staging** | `.github/workflows/deploy-staging.yml` | Otomatis pada `push` ke branch `staging` | Build image Docker `:staging` $\rightarrow$ Push ke GHCR $\rightarrow$ Auto Deploy via SSH ke VPS Staging + Nginx & Certbot. |
| **Deploy Production** | `.github/workflows/deploy.yml` | **Manual Only** (`workflow_dispatch`) | Hanya dijalankan saat developer mengklik tombol **"Run workflow"** di GitHub Actions untuk branch `main`. |
| **Database Backup** | `.github/workflows/backup.yml` | **Cron (02:00 WIB)** + Manual Trigger | Ekspor Oracle Data Pump (`expdp`) $\rightarrow$ Kompresi gzip $\rightarrow$ Upload GitHub Artifacts (90 hari) $\rightarrow$ Kirim dokumen file ke Bot Telegram. |
| **Database Restore** | `.github/workflows/restore.yml` | **Manual Only** (Guard: `RESTORE-CONFIRM`) | Mengimpor file backup Oracle (`impdp`) ke database target + notifikasi ke Bot Telegram. |

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
   - Staging: Container `inventory-staging-*`, volume `inventory_staging_oracle_data`, network `inventory_staging_network`, port default (3001, 8081).
   - Production: Container `inventory-*`, volume `inventory_oracle_data`, network `inventory_network`, port default (3000, 8080).
5. **Concurrency Group**:
   - Pipeline staging dan production memiliki queue terpisah sehingga tidak saling membatalkan (*cancel*).

---

## 3. Konfigurasi GitHub Repository & Environments

Panduan detail nilai dan copy-paste template secret tersedia di **[`infrastructure/DEPLOY-SECRETS.md`](file:///c:/Users/PITCHA/Documents/Project/inventory_net/infrastructure/DEPLOY-SECRETS.md)**.
