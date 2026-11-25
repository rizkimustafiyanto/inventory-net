# 🛡️ Playbook EF Core Migration, Isolasi Branch/Secret, & Disaster Recovery

Dokumen ini menjadi acuan operasional resmi tim developer dan operator deployment **InventoryNet Core** mulai dari **skenario normal**, **revert fitur**, **penanganan Orphaned Migration Guard**, hingga **worst-case recovery database Production**.

---

## 1. Arsitektur Pengamanan CI/CD & Database

### A. Lapis Isolasi Branch & Secrets
Setiap workflow di `.github/workflows/` dilindungi oleh guard branch (`validate-guard`) sebelum environment secrets dimuat:

| Workflow | Trigger | Branch Diizinkan | Target Environment | Pengaman Utama |
| :--- | :--- | :--- | :--- | :--- |
| **`ci.yml`** | `push (main)`, `pull_request` | Semua branch PR | *(Tanpa Secret)* | Build, Unit Test, & EF Model Check |
| **`deploy-staging.yml`** | `push (staging)`, `workflow_dispatch` | **`staging`** | `staging` | `github.ref == 'refs/heads/staging'` |
| **`deploy.yml`** | `workflow_dispatch` | **`main`** | `production` | Branch `main` + ketik `"deploy"` + **Pre-Deploy Backup DB** |
| **`backup.yml`** / **`backup-uploads.yml`** | `schedule`, `workflow_dispatch` | `staging` $\leftrightarrow$ `staging`<br>`main` $\leftrightarrow$ `production` | Dinamis sesuai branch | Branch Guard (`validate-guard`) |
| **`restore.yml`** / **`restore-uploads.yml`** | `workflow_dispatch` | `staging` $\leftrightarrow$ `staging`<br>`main` $\leftrightarrow$ `production` | Dinamis sesuai branch | Branch Guard + ketik `"RESTORE-CONFIRM"` + Guard anti-staging-ke-prod |

> [!IMPORTANT]
> **Aturan Cron Schedule & Default Branch:**
> - Di GitHub Actions, trigger `on: schedule` **selalu berjalan dari Default Branch** (saat ini: **`staging`**).
> - Oleh karena itu, selama Default Branch adalah `staging`, jadwal backup otomatis (`02:00 WIB` DB & `Senin 02:30 WIB` Uploads) otomatis hanya mem-backup **`staging`** agar tidak membocorkan/menyentuh secret `production`.
> - Saat aplikasi sudah rilis ke `production` dan Anda memindah Default Branch GitHub ke **`main`**, jadwal cron otomatis mem-backup **`production`**. *(Selama Default Branch masih `staging`, lakukan backup `production` via manual `workflow_dispatch` dari branch `main`).*

> [!CAUTION]
> **Wajib Konfigurasi di GitHub Web Settings (Agar Guard Tidak Bisa Di-bypass):**
> Buka **Settings $\rightarrow$ Environments** di repository GitHub:
> 1. Environment **`production`** $\rightarrow$ **Deployment branches and tags** $\rightarrow$ pilih **Selected branches** $\rightarrow$ tambahkan **`main`** saja *(disarankan aktifkan Required reviewers)*.
> 2. Environment **`staging`** $\rightarrow$ **Deployment branches and tags** $\rightarrow$ pilih **Selected branches** $\rightarrow$ tambahkan **`staging`** saja.
> 3. Pastikan nilai secret **`VPS_PATH`** berbeda antara `staging` (misal `/opt/inventory`) dan `production` (misal `/opt/inventory_prod`) agar file `.env.production`, compose, dan folder `backups/` tidak saling menimpa.

---

### B. Mekanisme Auto-Migration & Guard di Backend
Saat container `be-net` start ([Program.cs](file:///c:/Users/PITCHA/Documents/Project/inventory_net/be-net/src/Inventory.Api/Program.cs) & [DbInitializer.cs](file:///c:/Users/PITCHA/Documents/Project/inventory_net/be-net/src/Inventory.Infrastructure/Data/DbInitializer.cs)):
1. **Auto-Baselining DB Lama:** Jika Oracle DB sebelumnya terbuat dengan `EnsureCreatedAsync()` (tabel `m_user` sudah ada tetapi `__EFMigrationsHistory` belum ada), sistem otomatis membuat `__EFMigrationsHistory` dan mencatat migrasi baseline (`InitialCreate` & `AddAvatarUrlToUser`) tanpa error `ORA-00955`.
2. **Orphaned Migration Guard:** Sebelum `MigrateAsync()` dieksekusi, backend membandingkan riwayat `__EFMigrationsHistory` di DB dengan daftar file migration di build kode terbaru.
3. **Fail-Fast Startup:** Jika terjadi kegagalan `MigrationGuardException` (kebijakan `strict`), backend langsung **berhenti seketika** tanpa menunggu retry loop 72 detik dan tidak menjalankan web server—sehingga `verify-deployment.sh` otomatis menggagalkan deployment.
4. **CI Check Sebelum Build Docker:** Di `ci.yml`, `deploy-staging.yml`, dan `deploy.yml`, langkah `Verify EF Core Migrations Integrity` memverifikasi:
   - `dotnet ef migrations has-pending-model-changes` (memastikan tidak ada perubahan Entity yang lupa di-migrate).
   - `dotnet ef migrations script --idempotent` (memastikan semua file migrasi valid menghasilkan SQL Oracle).

---

## 2. Skenario Normal (Happy Path)

### Skenario 2.1: Developer Menambah Tabel / Kolom Baru
1. Developer mengubah/menambah Entity di `Inventory.Domain` dan konfigurasi di `ApplicationDbContext`.
2. Developer membuat file migrasi di lokal:
   ```powershell
   cd be-net
   dotnet ef migrations add AddSupplierTable -p src/Inventory.Infrastructure -s src/Inventory.Api
   ```
3. Menguji di lokal (`dotnet ef database update` atau `docker compose up --watch`).
4. Push & buat PR ke `staging` $\rightarrow$ `ci.yml` memastikan `has-pending-model-changes` **lulus (`exit 0`)**.
5. Merge ke `staging` $\rightarrow$ `deploy-staging.yml` build image baru & deploy $\rightarrow$ container backend otomatis menjalankan `MigrateAsync()` dan tabel `m_supplier` terbuat di Oracle Staging.

### Skenario 2.2: Developer Lupa Membuat Migration Setelah Mengubah Entity
- Developer mengubah `Product.cs` (misal tambah properti `Weight`) tanpa `dotnet ef migrations add`, lalu push / buat PR.
- **Yang terjadi:** Langkah `Verify EF Core Migrations Integrity` (`has-pending-model-changes`) di CI langsung **GAGAL**. Docker image rusak tidak akan terbuild dan tidak pernah mencapai Staging/Production.
- **Solusi:** Jalankan `dotnet ef migrations add <NamaMigrasi>` di lokal lalu commit & push ulang.

### Skenario 2.3: Rilis Aman ke Production (`main`)
1. Merge perubahan teruji dari `staging` ke `main`.
2. Buka GitHub Actions $\rightarrow$ **`Deploy (Production VPS)`** $\rightarrow$ pilih branch **`main`** $\rightarrow$ ketik **`deploy`** $\rightarrow$ biarkan **`orphaned_migration_policy`** di **`strict`**.
3. Workflow menjalankan CI & Build Image $\rightarrow$ menghubungkan SSH $\rightarrow$ menjalankan **`Pre-Deploy Database Backup`** (menyimpan file `backup_production_<timestamp>.dmp.gz` di server) $\rightarrow$ menarik image & menjalankan container baru (`MigrateAsync()`) $\rightarrow$ `verify-deployment.sh` $\rightarrow$ notifikasi Telegram sukses (termasuk nama file Pre-Deploy Backup).

---

## 3. Skenario Revert & Kesalahan Migration (Menengah hingga Darurat)

### Skenario 3.1: Migration Salah, BELUM Pernah di-Deploy ke Staging/Production (Masih di Lokal / PR)
Ini **satu-satunya kondisi** di mana `dotnet ef migrations remove` aman digunakan:
1. Jika belum dijalankan ke DB lokal:
   ```powershell
   dotnet ef migrations remove -p src/Inventory.Infrastructure -s src/Inventory.Api
   ```
2. Jika sudah dijalankan ke DB Docker lokal saja:
   ```powershell
   dotnet ef database update <NamaMigrasiSebelumnya> -p src/Inventory.Infrastructure -s src/Inventory.Api
   dotnet ef migrations remove -p src/Inventory.Infrastructure -s src/Inventory.Api
   ```

---

### Skenario 3.2: Sengaja Revert Fitur / Migration Salah yang SUDAH Terlanjur Deploy (SOP Resmi: Forward Corrective Migration)

> [!WARNING]
> **JANGAN PERNAH** menjalankan `dotnet ef migrations remove` atau `git revert` yang menghapus file migration apabila migration tersebut **sudah pernah ter-deploy** ke Staging atau Production!
> Karena `MigrateAsync()` **tidak pernah menjalankan `Down()` otomatis**, menghapus file migration membuat skema DB & `__EFMigrationsHistory` tertinggal sementara `ModelSnapshot.cs` mundur (*schema drift*).

**Langkah yang benar dan aman (Opsi A — Forward Corrective Migration):**
1. **Jangan hapus** file migration lama dari folder `Migrations/`.
2. Kembalikan (revert) kode C# fitur / properti di `Domain`, `Application`, `ApplicationDbContext`, dan UI ke kondisi semula.
3. Buat **migration kompensasi baru** yang maju ke depan:
   ```powershell
   cd be-net
   dotnet ef migrations add Revert_NamaFiturAtauMigrasiSalah -p src/Inventory.Infrastructure -s src/Inventory.Api
   ```
4. Periksa file migration baru tersebut (pastikan metode `Up()` berisi perintah yang tepat seperti `DropColumn` / `DropTable` / `AlterColumn`).
5. Commit & push $\rightarrow$ Staging dan Production otomatis mengeksekusi koreksi secara seragam dan riwayat `__EFMigrationsHistory` tetap sinkron 100%.

---

### Skenario 3.3: Developer Terlanjur Menghapus File Migration & Guard Memblokir Deploy (`MIGRATION GUARD BLOCKED`)

**Gejala di log backend / deploy gagal:**
```text
[MIGRATION GUARD BLOCKED] Database already has applied migration(s) missing from application code: [20261125101500_SalahMigration].
Refusing to boot to prevent schema drift / production corruption.
```

Artinya di DB Oracle (`__EFMigrationsHistory`) sudah tercatat `20261125101500_SalahMigration`, tetapi file `.cs`-nya hilang dari commit yang baru di-deploy.

**Pilih salah satu dari 3 jalur penyelesaian berikut sesuai kondisi aktual:**

#### Jalur 1: Kembalikan File Migration & Gunakan Forward Corrective Migration *(Paling Direkomendasikan)*
Gunakan jalur ini jika kolom/tabel dari migration salah tersebut memang masih ada di DB atau Anda ingin kode & DB kembali bersih tanpa manipulasi history manual:
1. Kembalikan file migration yang terhapus dari riwayat Git:
   ```bash
   git checkout <commit_hash_sebelum_hapus> -- be-net/src/Inventory.Infrastructure/Migrations/
   ```
2. Jika fitur/entity-nya memang ingin dibatalkan, ikuti **Skenario 3.2** (buat `dotnet ef migrations add Revert_...` di atas file yang dikembalikan itu).
3. Commit & push $\rightarrow$ deploy otomatis kembali hijau di mode `strict`.

#### Jalur 2: Emergency Bypass Sementara (`allow_once`)
Gunakan **hanya jika darurat** (aplikasi harus segera naik dan Anda yakin kode baru masih kompatibel dengan tabel DB saat ini, misalnya perubahan hanya kolom nullable baru, sambil tim menyiapkan perbaikan):
1. Jalankan workflow deploy secara manual (**`workflow_dispatch`**) dari branch target (`staging` atau `main`).
2. Pada opsi **`orphaned_migration_policy`**, pilih **`allow_once`**.
3. Backend akan melewati blokir sambil mencetak `WARNING` audit keras di log.
   - *Catatan:* Deploy `git push` otomatis berikutnya akan **tetap diblokir** oleh mode `strict` sampai Anda menyelesaikan **Jalur 1** atau **Jalur 3**.

#### Jalur 3: Self-Healing History Permanen (`prune_history`)
Gunakan jalur ini **hanya jika Anda 100% yakin** bahwa skema fisik tabel Oracle saat ini **SUDAH cocok dengan `ApplicationDbContextModelSnapshot.cs`** di kode terbaru (contohnya: efek perubahan DDL dari migration yatim sudah Anda bersihkan/drop manual di Oracle, atau migration tersebut tidak jadi mengubah tabel apa pun, atau hasil squash migration):
1. Pastikan dahulu lewat query Oracle/SQL Developer bahwa kolom/tabel di DB sudah benar-benar sesuai model kode terbaru! *(Ingat: `prune_history` **tidak pernah men-drop tabel/kolom fisik**, hanya menghapus catatan ID di `__EFMigrationsHistory` agar data tidak pernah hilang tanpa sengaja).*
2. Jalankan workflow deploy manual (**`workflow_dispatch`**) dari branch target (`staging` atau `main`).
3. Pada opsi **`orphaned_migration_policy`**, pilih **`prune_history`**.
4. Di Production, workflow akan mengambil **Pre-Deploy Database Backup** terlebih dahulu sebelum backend menyala, lalu backend menghapus baris `MigrationId` yatim tersebut dari `"__EFMigrationsHistory"` secara atomik (dalam transaksi) dan menjalankan migrasi baru jika ada.
5. Setelah 1x deploy `prune_history` berhasil, seluruh `git push` otomatis berikutnya dengan mode **`strict`** akan kembali normal 100%!

---

## 4. Worst-Case Scenario (Bencana DB / Kerusakan Data Production)

### Skenario 4.1: Deploy Production Baru Membawa Migration yang Merusak Struktur / Data
Misalkan developer terlanjur mengirim migration yang salah mengubah tipe kolom, menghapus data penting, atau memicu error aplikasi fatal di Production.

**Langkah Recovery Instan (Opsi B — Rollback Total via Pre-Deploy Backup):**
1. **Cari nama file Pre-Deploy Backup** dari:
   - Pesan notifikasi Bot Telegram pada deployment Production terakhir (`Pre-Deploy Backup: backup_production_YYYYMMDD_HHMMSS.dmp.gz`), **atau**
   - Log step `Pre-Deploy Database Backup` di run GitHub Actions **`Deploy (Production VPS)`**.
2. **Kembalikan kode ke commit stabil sebelum bencana** di branch `main` (via `git revert` atau PR perbaikan yang sudah di-test di `staging`).
3. **Restore Database Production:**
   - Buka GitHub Actions $\rightarrow$ **`Database Restore`**.
   - Pilih **Use workflow from**: **`main`** *(wajib dari `main`, akan ditolak jika dari branch lain)*.
   - **environment**: **`production`**
   - **backup_file_name**: isi nama file snapshot pre-deploy (`backup_production_YYYYMMDD_HHMMSS.dmp.gz`).
   - **confirm_text**: ketik persis **`RESTORE-CONFIRM`**.
   - *Hasil:* Seluruh skema tabel, data bisnis, dan tabel `"__EFMigrationsHistory"` kembali persis ke kondisi 1 menit sebelum deploy bermasalah!
4. *(Jika ada perubahan file upload media yang ikut bermasalah, jalankan juga `Uploads Volume Restore` dari branch `main` dengan file backup `uploads_production_...tar.gz` terkait).*
5. **Deploy ulang commit kode stabil** lewat **`Deploy (Production VPS)`** dari branch `main`. Karena `__EFMigrationsHistory` sudah ikut ter-restore ke titik stabil, mode `strict` akan langsung berjalan mulus!

---

## 5. Tabel Keputusan Cepat Saat Insiden (Cheat Sheet)

| Kondisi yang Terjadi | Tindakan yang Harus Diambil |
| :--- | :--- |
| Lupa buat migration, ditolak di CI (`has-pending-model-changes`) | Buat migration di lokal: `dotnet ef migrations add ...`, lalu push ulang. |
| Migration salah **belum** sempat di-deploy ke server | `dotnet ef database update <Prev>` (lokal) + `dotnet ef migrations remove`. |
| Migration salah / fitur **sudah** di-deploy ke Staging/Prod, mau dibatalkan | **Opsi A:** Jangan hapus file migration lama. Revert kode fitur + buat `dotnet ef migrations add Revert_...`. |
| Deploy gagal dengan `[MIGRATION GUARD BLOCKED]` | 1) Kembalikan file migration dari Git + buat corrective migration, **atau**<br>2) Jika skema DB sudah pasti bersih sesuai snapshot, jalankan manual `workflow_dispatch` dengan `prune_history`. |
| Data atau skema DB Production rusak akibat deploy terakhir | Jalankan **`Database Restore`** dari branch `main` pakai file **`Pre-Deploy Backup`** di log/Telegram $\rightarrow$ lalu re-deploy commit stabil dari `main`. |
| Backup/Restore gagal dengan `[SECURITY GUARD]` | Pastikan Anda memilih **"Use workflow from"** yang sesuai target (`staging` untuk Staging, `main` untuk Production). |
