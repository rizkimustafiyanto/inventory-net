# InventoryNet Core - Fullstack Inventory & Stock Management System

Sistem Manajemen Inventaris & Mutasi Stok skala enterprise yang dibangun menggunakan **.NET Core 8 Clean Architecture** (Backend), **Next.js 16 + React 19** (Frontend), dan **Oracle Database 23c Free** dengan arsitektur kontainerisasi **Docker Compose**.

Didesain untuk keandalan tinggi, pemisahan tanggung jawab murni (*Separation of Concerns*), penanganan *concurrency* mutasi stok, serta performa tinggi dengan *database-level pagination*.

> 📘 **Panduan Pengembang Lengkap**: Untuk panduan langkah demi langkah pembuatan tabel baru, migrasi EF Core, penggunaan Redis (distributed locking & caching), SignalR WebSockets real-time, serta implementasi CRUD end-to-end, silakan baca [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md).

---

## 🏗 1. Arsitektur Sistem

### A. Backend (`be-net`) - .NET 8 Clean Architecture
Struktur backend memisahkan kode ke dalam 4 lapisan independen:
```
be-net/
├── src/
│   ├── Inventory.Domain/           # Lapisan Inti Bisnis (Pure Domain, Nol Dependensi Eksternal)
│   │   ├── Entities/               # Entity tabel: Product, Category, User, StockMovement, StockReport
│   │   ├── Enums/                  # UserRole (Admin, Staff, Manager), StockMovementType (In, Out, Adjustment)
│   │   └── Interfaces/             # Kontrak IRepository<T>, IUnitOfWork
│   │
│   ├── Inventory.Application/      # Logika Bisnis & Orchestration
│   │   ├── Common/                 # Standard ApiResponse<T> dan PagedResult<T> dengan PaginationMeta
│   │   ├── DTOs/                   # Data Transfer Objects terpisah per fitur (Auth, Product, Stock, Report, User)
│   │   ├── Interfaces/             # Kontrak Service per domain
│   │   └── Services/               # Implementasi murni business logic (StockService, ProductService, dll.)
│   │
│   ├── Inventory.Infrastructure/   # Implementasi Akses Data & Teknologi Konkret
│   │   ├── Data/                   # Oracle EF Core (ApplicationDbContext) & Idempotent Seeder (DbInitializer)
│   │   ├── Repositories/           # GenericRepository<T> & UnitOfWork (Database-Level Paging & Aggregation)
│   │   └── Security/               # PasswordHasher (PBKDF2 SHA-256) & JwtTokenGenerator
│   │
│   └── Inventory.Api/              # Presentation Layer (Thin Controllers & HTTP Middleware)
│       ├── Controllers/            # Auth, Products, Categories, Stocks, Reports, Users
│       ├── Middlewares/            # GlobalExceptionMiddleware (Centralized Exception Handling)
│       └── Program.cs              # Startup pipeline, JWT Bearer Auth, Swagger OpenAPI, DB Retry Loop
│
└── tests/
    └── Inventory.Application.UnitTests/  # 14 Automated Unit Tests (xUnit, Moq, FluentAssertions)
```

---

### B. Konvensi Penamaan Tabel Oracle Database
Sistem secara ketat menerapkan penamaan tabel dengan awalan kategori:

| Awalan | Tipe Tabel | Nama Tabel | Deskripsi |
| :--- | :--- | :--- | :--- |
| **`m_`** | **Master** | `m_product` | Master katalog produk, harga, stok fisik, dan batas minimum |
| | | `m_category` | Master kategori klasifikasi barang |
| | | `m_user` | Master akun pengguna, peran akses (*Role*), dan status aktif |
| **`t_`** | **Transaction** | `t_stock_movement` | Transaksi riwayat mutasi stok (Barang Masuk, Keluar, dan Koreksi Opname) |
| **`r_`** | **Report** | `r_stock_summary` | Snapshot laporan harian, pergerakan masuk/keluar, dan valuasi aset gudang |

---

### C. Frontend (`fe-react`) - Next.js 16 App Router (Feature-Driven)
* **Framework**: Next.js 16 (Turbopack), React 19, TypeScript
* **Styling**: Tailwind CSS v4, Shadcn UI (`components/ui`), Lucide React
* **State & Data Fetching**: Zustand (Auth Store), TanStack Query, Axios dengan JWT Interceptor
* **Halaman Publik & Fitur**:
  - `/` : **Public Landing Page** dengan live system status, diagram arsitektur, dan ringkasan fitur.
  - `/login` : Login form dengan tombol *one-click preset* (`admin`, `staff`, `manager`).
  - `/dashboard` : KPI Cards (Total SKU, Total Unit, Menipis, Habis), mutasi terbaru, dan peringatan stok.
  - `/dashboard/products` : Katalog produk dengan pencarian SKU/Nama, filter kategori, filter *low-stock*, modal tambah/edit, dan kontrol paginasi.
  - `/dashboard/stocks` : Form transaksi mutasi (*In*, *Out*, *Adjustment*) dengan *live preview* stok akhir dan histori mutasi.
  - `/dashboard/categories` : Manajemen kategori barang.
  - `/dashboard/reports` : Laporan valuasi nilai aset barang (Rupiah), ringkasan pergerakan, cetak PDF, dan ekspor CSV.
  - `/dashboard/users` : Manajemen pengguna (khusus Admin) untuk menambah akun, toggle status aktif, dan hapus user non-admin.

---

## ⚡ 2. Fitur Unggulan Arsitektur & Performa

### 1. Database-Level Query Execution & Pagination
Paginasi dan pencarian data **tidak dilakukan di memori aplikasi**, melainkan dieksekusi langsung di level Oracle Database engine:
```sql
SELECT ... FROM "m_product" "m"
WHERE (LOWER("m"."Name") LIKE :search)
ORDER BY "m"."CreatedAt" DESC
OFFSET :skip ROWS FETCH NEXT :take ROWS ONLY;
```
*Hasilnya, penggunaan RAM aplikasi konstan $O(1)$ dan transfer payload jaringan sangat ringan.*

### 2. Guardrail & Hard Limit Keamanan Data
- **Max Page Size Clamp**: Berapa pun limit yang diminta client (misal: `pageSize=99999`), sistem membatasi maksimal **100 data per halaman**.
- **Page Number Guard**: Nilai `pageNumber <= 0` otomatis dinormalisasi ke halaman `1`.

### 3. Standarisasi JSON API Response Modern
Format response mengikuti spesifikasi standar industri (JSON:API / RESTful Best Practice), di mana `data` langsung berupa array murni dan `meta` berada sejajar di root level:
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "sku": "ELEC-LOGI-M100",
      "name": "Mouse Wireless Logitech M100",
      "stockQuantity": 25,
      "categoryName": "Elektronik & Gadget"
    }
  ],
  "meta": {
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 24,
    "totalPages": 3,
    "hasPreviousPage": false,
    "hasNextPage": true
  },
  "errors": null
}
```

---

## 👥 3. Hak Akses Pengguna (Role-Based Access Control)

| Peran (Role) | Default Akun | Password | Cakupan Hak Akses |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | **Full Akses**: CRUD Master Data, Mutasi Stok, Laporan Keuangan, dan Manajemen Pengguna (`/dashboard/users`). |
| **Staff** | `staff` | `staff123` | **Operasional Gudang**: Input Barang Masuk, Keluar, Koreksi Opname, serta melihat katalog dan mutasi. Dibatasi: tidak bisa hapus produk/kategori permanen dan tidak ada menu user. |
| **Manager** | `manager` | `manager123` | **Pengawasan & Audit**: Melihat katalog produk, riwayat mutasi stok, dan laporan nilai valuasi aset gudang. |

---

## 🚀 4. Cara Menjalankan Aplikasi (Docker)

Seluruh komponen (Oracle Database, Backend .NET, dan Frontend Next.js) telah dikonfigurasi melalui Docker Compose. Anda **tidak perlu menginstal .NET SDK, Node.js, atau Oracle** pada sistem operasi host.

### Mode Development (Hot Reload & Realtime Watch):
Untuk pengembangan dengan fitur live reload otomatis tanpa perlu rebuild/recreate setiap ada perubahan kode:
```bash
docker compose up --watch
```
> Atau jalankan secara terpisah: `docker compose up -d` kemudian `docker compose watch`.

* **Backend (`be-net`)**: Mendukung .NET Hot Reload via `dotnet watch run`. Perubahan di file `.cs` akan langsung dimuat secara instan. Jika file `.csproj` atau `Inventory.sln` diubah, Docker Compose akan otomatis me-rebuild container.
* **Frontend (`fe-react`)**: Berjalan di mode `next dev` (Turbopack). Perubahan komponen/halaman di folder `src` atau asset di `public` langsung di-sync dan direfresh di browser via Fast Refresh.

### Mode Production / Background:
```bash
docker compose up -d --build
```

### Akses Layanan:
* 🌐 **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* 📑 **API Documentation (Swagger UI)**: [http://localhost:8080/swagger](http://localhost:8080/swagger)
* 🗄️ **Oracle Database Free 23c**: `localhost:1521` (PDB: `FREEPDB1`, User: `inventory_user`, Pass: `YourPassword123`)

---

## 🧪 5. Menjalankan Unit Testing (.NET Core)

Project dilengkapi dengan 14 unit test komprehensif yang memvalidasi business logic, aturan mutasi stok, pencegahan stok minus, validasi SKU unik, dan batas limit paginasi.

Jalankan test suite menggunakan Docker SDK:
```bash
docker run --rm -v "${PWD}/be-net:/app" -w /app mcr.microsoft.com/dotnet/sdk:8.0 dotnet test tests/Inventory.Application.UnitTests/Inventory.Application.UnitTests.csproj
```

**Hasil Pengujian Terakhir**:
```
Test run for /app/tests/Inventory.Application.UnitTests/bin/Debug/net8.0/Inventory.Application.UnitTests.dll (.NETCoreApp,Version=v8.0)
Passed!  - Failed: 0, Passed: 14, Skipped: 0, Total: 14 (100% Pass)
```

---

## 📮 6. Postman Collection

Telah disediakan file koleksi Postman siap pakai di dalam folder dokumentasi:
📁 **`docs/postman/inventory_api.postman_collection.json`**

### Fitur Koleksi Postman:
1. **Auto Token Ingestion**: Setiap kali me-request login (`Admin`, `Staff`, atau `Manager`), JWT Token otomatis disimpan ke variabel koleksi `{{token}}` dan disuntikkan ke seluruh endpoint lainnya.
2. **Kategori Endpoint**:
   - `1. Authentication`: Login, User Profile.
   - `2. Products (Master - m_product)`: Paged List, Search, Low-Stock Filter, CRUD.
   - `3. Categories (Master - m_category)`: List, Create, Delete.
   - `4. Stocks (Transactions - t_stock_movement)`: Stock In, Stock Out, Adjustment (Opname), Movements Paged, Dashboard Summary.
   - `5. Reports (Report - r_stock_summary)`: Stock Summary & Valuation Snapshot.
   - `6. User Management (m_user)`: List Users, Create User, Toggle Status, Delete User.

---

## 🛠️ Ringkasan Stack Teknologi
- **Backend**: C# 12, .NET Core 8, ASP.NET Core Web API, Entity Framework Core 8, Oracle.EntityFrameworkCore 8.
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Shadcn UI, Axios, TanStack React Query.
- **Database**: Oracle Database 23c Free & Redis 7.
- **Testing**: xUnit, Moq, FluentAssertions.
- **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD, Cloudflare Tunnel.

---

## 📚 7. Dokumentasi Lanjutan
- **[Developer Guide](./docs/DEVELOPER_GUIDE.md)** — Panduan EF Core Migrations, Redis Lock/Cache, SignalR WebSockets, & contoh CRUD.
- **[GitHub Actions & Isolasi CI/CD](./docs/deployment/github_actions_setup.md)** — Peta seluruh workflow deploy, backup, restore, & 6 lapis isolasi branch/environment.
- **[Panduan GitHub Secrets](./docs/deployment/github_secrets_guide.md)** — Daftar lengkap secret per environment & template `.env`.
- **[Playbook Migration & Recovery](./docs/deployment/migration_and_recovery_playbook.md)** — SOP migrasi, cara revert fitur aman, *Orphaned Migration Guard*, hingga *worst-case disaster recovery*.
