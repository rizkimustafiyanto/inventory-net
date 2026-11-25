# Panduan Setup GitHub Actions CI/CD (Staging & Production)

Dokumen ini menjelaskan seluruh pipeline GitHub Actions pada project **InventoryNet Core**, mencakup CI/CD, deployment VPS, domain Nginx SSL, serta backup/restore database dengan integrasi Telegram Bot.

---

## 1. Ringkasan Seluruh Workflow

| Workflow | File | Trigger | Tujuan |
| :--- | :--- | :--- | :--- |
| **CI** | `.github/workflows/ci.yml` | `PR` ke `staging` & `main`, serta `push` ke `main` | Menjalankan build, unit test .NET 8, verifikasi sinkronisasi EF Core Migration (`has-pending-model-changes` & idempotent SQL), serta lint/type-check/build Next.js 16. |
| **Deploy Staging** | `.github/workflows/deploy-staging.yml` | `push` ke branch `staging` + Manual (`workflow_dispatch`) | CI + EF Migration check $\rightarrow$ Build image `:staging` $\rightarrow$ Deploy via SSH ke VPS Staging + Cloudflare/Nginx + Smoke Test (`verify-deployment.sh`). |
| **Deploy Production** | `.github/workflows/deploy.yml` | **Manual Only** (`workflow_dispatch` di `main`) | Hanya diizinkan dari branch `main` dengan konfirmasi `"deploy"`. Otomatis membuat **Pre-Deploy Backup Oracle DB** sebelum upgrade container Production. |
| **Database Backup** | `.github/workflows/backup.yml` | **Cron (02:00 WIB)** + Manual Trigger | Ekspor Oracle Data Pump (`expdp`) $\rightarrow$ Kompresi gzip $\rightarrow$ Upload GitHub Artifacts (90 hari) $\rightarrow$ Kirim ke Bot Telegram. Terkunci guard branch (`staging` vs `main`). |
| **Database Restore** | `.github/workflows/restore.yml` | **Manual Only** (Guard: `RESTORE-CONFIRM`) | Mengimpor file backup Oracle (`impdp`) ke database target + guard branch (`staging` vs `main`) & anti-staging-ke-prod + notifikasi Telegram. |
| **Uploads Backup** | `.github/workflows/backup-uploads.yml` | **Cron (Senin 02:30 WIB)** + Manual Trigger | Mengarsipkan volume media `/app/uploads` (`.tar.gz`) $\rightarrow$ Artifacts (90 hari) $\rightarrow$ Kirim ke Bot Telegram. Terkunci guard branch (`staging` vs `main`). |
| **Uploads Restore** | `.github/workflows/restore-uploads.yml` | **Manual Only** (Guard: `RESTORE-CONFIRM`) | Mengekstrak arsip backup media ke `/app/uploads` target + guard branch (`staging` vs `main`) & anti-staging-ke-prod + notifikasi Telegram. |

---

## 2. Jaminan Isolasi Antara Staging & Main

Pipeline ini menerapkan 6 lapis isolasi ketat:
1. **Branch Guard (`validate-guard`) di Semua Workflow Deploy, Backup, & Restore**:
   - Operasi target `staging` hanya diizinkan dari `refs/heads/staging`.
   - Operasi target `production` hanya diizinkan dari `refs/heads/main` (dan khusus deploy wajib input `"deploy"`).
   - Branch fitur (misal `belajar`) otomatis ditolak sebelum membaca environment secret apa pun.
   - Jadwal `on: schedule` otomatis mengikuti branch asal (selama Default Branch GitHub adalah `staging`, cron otomatis berjalan khusus untuk environment `staging`; saat Default Branch dipindah ke `main`, cron otomatis berjalan untuk `production`).
2. **GitHub Environments Protection (Wajib di Settings UI)**:
   - Di **Settings $\rightarrow$ Environments**, kunci `staging` ke **Selected branches: `staging`** dan `production` ke **Selected branches: `main`** agar guard tidak bisa di-bypass lewat edit YAML di branch lain.
3. **Migration Guard & Pre-Deploy Snapshot**:
   - Aplikasi memakai `MigrateAsync()` + *Orphaned Migration Guard* (`strict` by default) + Pre-Deploy Backup otomatis khusus Production.
   - Panduan lengkap penanganan migrasi dari normal hingga *worst-case scenario* tersedia di **[`migration_and_recovery_playbook.md`](./migration_and_recovery_playbook.md)**.
4. **Docker Image Tag (GHCR)**:
   - Staging: `ghcr.io/<owner>/inventory-backend:staging`
   - Production: `ghcr.io/<owner>/inventory-backend:latest` & `:<git-sha>`
5. **Kontainer, Path VPS, & Jaringan Server**:
   - Staging: Container `inventory-staging-*`, volume `inventory_staging_oracle_data`, network `inventory_staging_network`, port default (3001, 8081), `VPS_PATH` terpisah (misal `/opt/inventory`).
   - Production: Container `inventory-*`, volume `inventory_oracle_data`, network `inventory_network`, port default (3000, 8080), `VPS_PATH` terpisah (misal `/opt/inventory_prod`).
6. **Concurrency Group**:
   - Pipeline staging dan production memiliki queue terpisah sehingga tidak saling membatalkan (*cancel*).

---

## 3. Konfigurasi GitHub Repository & Environments

Panduan detail nilai dan copy-paste template secret tersedia di **[`github_secrets_guide.md`](./github_secrets_guide.md)**.
