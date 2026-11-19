# InventoryNet (Fullstack Web Inventory System)

Sistem Manajemen Inventaris & Mutasi Stok berbasis **.NET 8 Clean Architecture** (Backend) dan **Next.js 16 + React 19** (Frontend) dengan **Oracle Database**.

---

## 🏗 Arsitektur Sistem

### Backend (`be-net`) - .NET 8 Clean Architecture
Struktur backend memisahkan tanggung jawab secara tegas (*Separation of Concerns*):
- **`Inventory.Domain`**: Core entity (`Product`, `Category`, `StockMovement`, `User`, `StockReport`), Enums, dan Kontrak Interface Repository (`IRepository<T>`, `IUnitOfWork`).
- **`Inventory.Application`**: Business logic services (`ProductService`, `StockService`, `CategoryService`, `AuthService`, `ReportService`), DTOs, dan validasi pergerakan stok.
- **`Inventory.Infrastructure`**: Akses database Oracle via **Entity Framework Core** (`Oracle.EntityFrameworkCore`), implementasi Repositories, UnitOfWork, hashing password, dan JWT Token Generator.
- **`Inventory.Api`**: REST Controllers, Policy & JWT Authorization, Middleware Global Exception, dan Swagger UI OpenAPI.

### 🏛 Konvensi Penamaan Tabel Oracle Database
Sesuai standar arsitektur database enterprise:
- **Master (`m_`)**:
  - `m_product` : Master katalog produk, harga, batas minimum stok
  - `m_category` : Master kategori barang
  - `m_user` : Master pengguna aplikasi dan role (Admin / Staff)
- **Transaction (`t_`)**:
  - `t_stock_movement` : Transaksi mutasi pergerakan stok (Barang Masuk, Barang Keluar, Koreksi Opname)
- **Report (`r_`)**:
  - `r_stock_summary` : Snapshot agregasi laporan stok harian dan valuasi nilai aset barang

### Frontend (`fe-react`) - Next.js App Router (Feature-Driven)
Mengadopsi struktur modular dari `portal_digital/frontend`:
- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI (`components/ui`), Lucide React
- **State & Data**: Zustand (Auth store), TanStack React Query, Axios (JWT bearer interceptor)
- **Features**:
  - `features/auth`: Login, JWT handling, peran User (Admin / Staff)
  - `features/products`: Katalog produk, filter pencarian & stok menipis, modal tambah & hapus
  - `features/stocks`: Pencatatan mutasi stok (Barang Masuk, Barang Keluar, Koreksi Stok) dengan live preview, serta riwayat mutasi
  - `features/categories`: Pengelolaan kategori produk

---

## 🚀 Cara Menjalankan dengan Docker (1 Langkah)

Karena seluruh konfigurasi Dockerfile dan `docker-compose.yml` telah disediakan, Anda **tidak perlu menginstal .NET SDK ataupun Oracle di OS lokal**.

Cukup jalankan perintah berikut di root folder project:

```bash
docker compose up --build
```

Setelah container berjalan:
- **Frontend Web**: Buka di browser [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger**: Buka di browser [http://localhost:8080/swagger](http://localhost:8080/swagger)
- **Oracle Database**: Berjalan di port `1521` (PDB: `FREEPDB1`, User: `inventory_user`)

---

## 🔑 Akun Bawaan (Default Seed Users)

Sistem secara otomatis menginisialisasi database dengan akun dan data sampel berikut:

| Role | Username | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Akses penuh (CRUD Produk, Kategori, Mutasi Stok, Hapus Data) |
| **Staff Gudang** | `staff` | `staff123` | Akses operasional (Lihat Katalog, Catat Barang Masuk/Keluar/Koreksi) |

*(Tersedia tombol preset di halaman login untuk mengisi otomatis kredensial di atas)*.

---

## 📦 Endpoint API Utama

- **Auth**:
  - `POST /api/auth/login` - Otentikasi & perolehan JWT
  - `POST /api/auth/register` - Pendaftaran akun baru
  - `GET /api/auth/me` - Informasi profil pengguna aktif
- **Products**:
  - `GET /api/products` - Daftar produk terpaginasi (filter SKU, nama, kategori, low-stock)
  - `POST /api/products` - Tambah produk baru
  - `GET /api/products/{id}` - Detail produk
  - `PUT /api/products/{id}` - Update produk
  - `DELETE /api/products/{id}` - Hapus produk (Admin only)
- **Stocks (Inventory Movements)**:
  - `POST /api/stocks/movement` - Catat mutasi: Masuk (`1`), Keluar (`2`), Koreksi (`3`)
  - `GET /api/stocks/movements` - Riwayat pergerakan stok
  - `GET /api/stocks/summary` - Metrik ringkasan (Total SKU, Total unit fisik, Stok menipis, Stok habis)
- **Categories**:
  - `GET /api/categories` - Daftar kategori produk
  - `POST /api/categories` - Tambah kategori
  - `DELETE /api/categories/{id}` - Hapus kategori
