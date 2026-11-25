# Panduan Pengembang (Developer Guide) InventoryNet
## EF Core Migrations, Redis, SignalR WebSockets, dan Implementasi CRUD End-to-End

Panduan ini disusun secara komprehensif, mudah dipahami, dan aplikatif bagi pengembang yang ingin mempelajari serta mempraktikkan:
1. **Pembuatan Tabel & Migrasi Database EF Core** pada Oracle Database (Konvensi `m_`, `t_`, `r_`).
2. **Integrasi Redis**: Distributed Caching & Distributed Locking (Mencegah Race Condition).
3. **Integrasi SignalR / WebSockets**: Push Notification Real-Time antar Server dan Client React.
4. **Alur Praktik CRUD End-to-End**: Mulai dari Domain Entity, EF Core, Application Service, REST API Controller, hingga UI Next.js / React.

---

## Daftar Isi
1. [Arsitektur Proyek & Konvensi Database](#1-arsitektur-proyek--konvensi-database)
2. [Panduan Pembuatan Tabel & Migrasi EF Core](#2-panduan-pembuatan-tabel--migrasi-ef-core)
3. [Panduan Integrasi & Penggunaan Redis](#3-panduan-integrasi--penggunaan-redis)
4. [Panduan Integrasi SignalR / WebSockets](#4-panduan-integrasi-signalr--websockets)
5. [Tutorial Praktik CRUD Lengkap: Modul Supplier (Pemasok)](#5-tutorial-praktik-crud-lengkap-modul-supplier-pemasok)
6. [Daftar Perintah Penting (Cheat Sheet)](#6-daftar-perintah-penting-cheat-sheet)

---

## 1. Arsitektur Proyek & Konvensi Database

### 1.1 Struktur Clean Architecture (.NET 8)
Aplikasi ini membagi kode ke dalam 4 layer terpisah dengan arah ketergantungan mengarah ke dalam (*Dependency Rule*):

```
       ┌───────────────────────────────┐
       │   Inventory.Api (Web/REST)    │ ─── Controller, Hubs, Middlewares, Program.cs
       └──────────────┬────────────────┘
                      │
       ┌──────────────▼────────────────┐
       │   Inventory.Infrastructure    │ ─── EF Core DbContext, Repositories, Redis, Oracle
       └──────────────┬────────────────┘
                      │
       ┌──────────────▼────────────────┐
       │     Inventory.Application     │ ─── Services, DTOs, Validations, Business Logic
       └──────────────┬────────────────┘
                      │
       ┌──────────────▼────────────────┐
       │       Inventory.Domain        │ ─── Entities, Enums, Core Interfaces (No Dependency)
       └───────────────────────────────┘
```

1. **`Inventory.Domain`**: Inti bisnis (*Enterprise Kernel*). Berisi entitas POCO murni C# tanpa ketergantungan pada database atau framework luar.
2. **`Inventory.Application`**: Logika use case aplikasi, validasi alur kerja, transfer data (DTO), dan interface service.
3. **`Inventory.Infrastructure`**: Akses data fisik, implementasi EF Core (`ApplicationDbContext`), koneksi Oracle, koneksi Redis, penyimpanan file, dan hashing password.
4. **`Inventory.Api`**: Entry point aplikasi, REST controller, middleware, WebSocket hubs, dan konfigurasi Dependency Injection.

---

### 1.2 Konvensi Penamaan Tabel Oracle Database
Agar struktur database rapi, terstandarisasi, dan mudah diaudit, seluruh tabel diwajibkan menggunakan prefiks 2 huruf berikut:

| Prefiks | Kategori | Deskripsi | Contoh Tabel yang Sudah Ada |
| :--- | :--- | :--- | :--- |
| `m_` | **Master** | Data master referensi yang jarang berubah dan menjadi rujukan data transaksi. | `m_category`, `m_product`, `m_user` |
| `t_` | **Transaction** | Data transaksi yang terus bertambah mencatat aktivitas operasional. | `t_stock_movement` |
| `r_` | **Report** | Data agregasi/summary historis untuk pelaporan dan valuasi aset. | `r_stock_summary` |

---

## 2. Panduan Pembuatan Tabel & Migrasi EF Core

### 2.1 Konsep Dasar Migrasi EF Core
Migrasi adalah cara EF Core untuk memperbarui skema database (membuat tabel baru, menambah kolom, index, relasi foreign key) secara terstruktur melalui kode C#, tanpa perlu menulis DDL SQL manual.

Alur kerjanya:
```
Kode C# (Entity & Fluent API) ──▶ dotnet ef migrations add ──▶ Berkas Migrasi C# ──▶ dotnet ef database update ──▶ Tabel Oracle Terbuat
```

---

### 2.2 Langkah Demi Langkah Membuat Tabel Baru

Misalkan kita ingin membuat tabel master baru: **Pemasok Barang (`m_supplier`)**.

#### Langkah 1: Buat Entity di `Inventory.Domain`
Buat file di `be-net/src/Inventory.Domain/Entities/Supplier.cs`:
```csharp
namespace Inventory.Domain.Entities;

public class Supplier
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;       // Kode Supplier unik (misal: SUP-001)
    public string Name { get; set; } = string.Empty;       // Nama Perusahaan/Supplier
    public string? ContactPerson { get; set; }             // Nama PIC
    public string? Phone { get; set; }                     // Nomor Telepon
    public string? Email { get; set; }                     // Email
    public string? Address { get; set; }                   // Alamat
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
```

#### Langkah 2: Daftarkan di `ApplicationDbContext` & Fluent API
Buka `be-net/src/Inventory.Infrastructure/Data/ApplicationDbContext.cs`:

1. **Tambahkan `DbSet`**:
```csharp
// Master Tables (m_)
public DbSet<Product> Products => Set<Product>();
public DbSet<Category> Categories => Set<Category>();
public DbSet<User> Users => Set<User>();
public DbSet<Supplier> Suppliers => Set<Supplier>(); // <-- Tambahkan ini
```

2. **Konfigurasi Tabel & Kolom di `OnModelCreating`**:
```csharp
// 6. MASTER: m_supplier
modelBuilder.Entity<Supplier>(entity =>
{
    entity.ToTable("m_supplier"); // Wajib prefiks m_
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Id).ValueGeneratedOnAdd();
    
    entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
    entity.HasIndex(e => e.Code).IsUnique(); // Kode unik
    
    entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
    entity.Property(e => e.ContactPerson).HasMaxLength(150);
    entity.Property(e => e.Phone).HasMaxLength(50);
    entity.Property(e => e.Email).HasMaxLength(150);
    entity.Property(e => e.Address).HasMaxLength(500);
});
```

---

### 2.3 Menjalankan Perintah Migrasi

Buka terminal PowerShell pada root folder solusi (`be-net/`):

#### 1. Membuat Berkas Migrasi Baru
```powershell
dotnet ef migrations add AddSupplierTable -p src/Inventory.Infrastructure -s src/Inventory.Api
```
* **`-p src/Inventory.Infrastructure`**: Proyek tempat DbContext dan berkas migrasi disimpan.
* **`-s src/Inventory.Api`**: Proyek startup yang memiliki `appsettings.json` dan connection string database.

Perintah ini akan menghasilkan file migrasi baru di folder `src/Inventory.Infrastructure/Migrations/` dengan nama timestamp, misalnya `20261124_AddSupplierTable.cs`.

#### 2. Menerapkan Migrasi ke Oracle Database
```powershell
dotnet ef database update -p src/Inventory.Infrastructure -s src/Inventory.Api
```
EF Core akan menghubungkan ke Oracle Database dan mengeksekusi perintah SQL `CREATE TABLE "m_supplier" (...)`.

#### 3. Membatalkan (Rollback) Migrasi jika Terjadi Kesalahan
- **Jika HANYA ada di lokal dan BELUM pernah di-deploy ke Staging/Production**:
  ```powershell
  # Jika belum dieksekusi ke DB lokal:
  dotnet ef migrations remove -p src/Inventory.Infrastructure -s src/Inventory.Api

  # Jika sudah terlanjur dieksekusi ke DB Docker lokal saja:
  dotnet ef database update <NamaMigrasiSebelumnya> -p src/Inventory.Infrastructure -s src/Inventory.Api
  dotnet ef migrations remove -p src/Inventory.Infrastructure -s src/Inventory.Api
  ```
- **Jika SUDAH terlanjur di-deploy ke Staging atau Production:**
  > ⚠️ **DILARANG keras memakai `dotnet ef migrations remove`!** Sistem backend dilindungi oleh *Orphaned Migration Guard* (`strict`), sehingga menghapus migration yang sudah tercatat di database server akan menggagalkan deployment.
  - **SOP Resmi (Forward Corrective Migration):** Revert kode fitur/entity, lalu buat migration koreksi baru (`dotnet ef migrations add Revert_NamaFitur`) tanpa menghapus file migration lama.
  - Untuk skenario lanjutan (*escape hatch* `allow_once` / `prune_history` dan *worst-case restore*), baca **[`docs/deployment/migration_and_recovery_playbook.md`](file:///c:/Users/PITCHA/Documents/Project/inventory_net/docs/deployment/migration_and_recovery_playbook.md)**.

---

## 3. Panduan Integrasi & Penggunaan Redis

Aplikasi ini memanfaatkan Redis untuk 2 fungsi utama:
1. **Distributed Locking** (Paling Krusial): Mencegah race condition ketika 2 petugas atau proses mencatat mutasi pada produk yang sama di waktu bersamaan (mikrodetik yang sama).
2. **Distributed Caching**: Mempercepat respon data read-heavy (seperti ringkasan KPI dashboard dan list kategori) tanpa membebani database Oracle.

### 3.1 Arsitektur Penyambungan Redis
Koneksi Redis dikonfigurasi melalui interface `IConnectionMultiplexer` dari library `StackExchange.Redis`.

File konfigurasi di `be-net/src/Inventory.Infrastructure/DependencyInjection.cs`:
```csharp
var redisConn = configuration.GetConnectionString("Redis")
    ?? configuration["Redis:ConnectionString"]
    ?? "localhost:6379";

var redisOptions = ConfigurationOptions.Parse(redisConn);
redisOptions.AbortOnConnectFail = false; // Mencegah crash jika Redis sedang booting
redisOptions.ConnectTimeout = 3000;

var multiplexer = ConnectionMultiplexer.Connect(redisOptions);
services.AddSingleton<IConnectionMultiplexer>(multiplexer);
```

---

### 3.2 Cara Menggunakan Distributed Lock (Mencegah Race Condition)

Interface `IDistributedLockService` telah disediakan di `Inventory.Application.Interfaces`:
```csharp
public interface IDistributedLockService
{
    Task<IDisposable?> AcquireLockAsync(
        string resourceKey,
        TimeSpan timeout,
        TimeSpan expiry,
        CancellationToken cancellationToken = default);
}
```

#### Contoh Penerapan pada Service:
Lihat bagaimana `StockService.cs` melindungi stok produk saat mutasi:
```csharp
public async Task<StockMovementDto> RecordMovementAsync(CreateStockMovementDto dto, long? userId)
{
    // 1. Kunci resource produk berdasarkan ID-nya: "product:{dto.ProductId}"
    var lockKey = $"product:{dto.ProductId}";
    
    // 2. Gunakan idiom using. Lock akan otomatis DILEPAS begitu blok kode selesai!
    using (var lockHandle = await _lockService.AcquireLockAsync(
        lockKey, 
        timeout: TimeSpan.FromSeconds(5),   // Maksimal waktu menunggu antrean lock
        expiry: TimeSpan.FromSeconds(10)))  // Lock otomatis kadaluarsa jika server crash
    {
        if (lockHandle == null)
        {
            throw new InvalidOperationException("Produk sedang diproses oleh transaksi lain. Harap coba beberapa detik lagi.");
        }

        // --- MULAI BLOK AMAN (CRITICAL SECTION) ---
        // Di sini dijamin 100% tidak ada proses lain yang membaca/mengubah produk ini secara bersamaan
        var product = await _productRepository.GetByIdAsync(dto.ProductId);
        
        // Validasi stok minus
        if (dto.Type == StockMovementType.Out && product.StockQuantity < dto.Quantity)
        {
            throw new InvalidOperationException("Stok tidak mencukupi!");
        }

        // Lakukan kalkulasi stok baru
        product.StockQuantity -= dto.Quantity;
        await _productRepository.UpdateAsync(product);
        await _unitOfWork.SaveChangesAsync();
        // --- SELESAI BLOK AMAN ---
    } // <-- Lock otomatis dilepas di sini secara aman (Dispose)
}
```

---

### 3.3 Cara Menggunakan Redis Caching (Key-Value)

Untuk menyimpan atau membaca data cache dari Redis:
```csharp
public class CategoryService : ICategoryService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly IRepository<Category> _categoryRepo;

    public CategoryService(IRepository<Category> categoryRepo, IConnectionMultiplexer? redis = null)
    {
        _categoryRepo = categoryRepo;
        _redis = redis;
    }

    public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
    {
        const string cacheKey = "cache:categories:all";

        // 1. Cek apakah data ada di Redis Cache
        if (_redis != null && _redis.IsConnected)
        {
            var db = _redis.GetDatabase();
            string? cachedJson = await db.StringGetAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedJson))
            {
                return JsonSerializer.Deserialize<List<CategoryDto>>(cachedJson)!;
            }
        }

        // 2. Jika tidak ada di cache, ambil dari Database Oracle
        var categories = await _categoryRepo.GetAllAsync();
        var dtos = categories.Select(c => new CategoryDto { Id = c.Id, Name = c.Name }).ToList();

        // 3. Simpan ke Redis dengan TTL (Time-To-Live) 30 Menit
        if (_redis != null && _redis.IsConnected)
        {
            var db = _redis.GetDatabase();
            var json = JsonSerializer.Serialize(dtos);
            await db.StringSetAsync(cacheKey, json, TimeSpan.FromMinutes(30));
        }

        return dtos;
    }

    public async Task InvalidateCacheAsync()
    {
        // Panggil ini setiap kali ada Create, Update, atau Delete Kategori
        if (_redis != null && _redis.IsConnected)
        {
            var db = _redis.GetDatabase();
            await db.KeyDeleteAsync("cache:categories:all");
        }
    }
}
```

---

## 4. Panduan Integrasi SignalR / WebSockets

SignalR menyediakan koneksi full-duplex dua arah. Begitu ada perubahan data di database oleh seorang staf (misal mencatat barang masuk), server langsung mem-push event ke layar browser seluruh staf lain tanpa perlu refresh halaman!

### 4.1 Alur Kerja SignalR di Backend

```
Browser React / Next.js ◄────── WebSocket (/hubs/inventory) ──────► InventoryHub (ASP.NET Core)
                                                                             ▲
                                                                             │ Broadcast
                                                                  InventoryNotificationService
                                                                             ▲
                                                                             │ Trigger
                                                                      StockService (C#)
```

#### 1. Hub Definition (`InventoryHub.cs`)
File: `be-net/src/Inventory.Api/Hubs/InventoryHub.cs`:
```csharp
using Microsoft.AspNetCore.SignalR;

namespace Inventory.Api.Hubs;

public class InventoryHub : Hub
{
    public const string HubUrl = "/hubs/inventory";
}
```

#### 2. Service Notifikasi (`InventoryNotificationService.cs`)
File: `be-net/src/Inventory.Api/Services/InventoryNotificationService.cs`:
```csharp
public class InventoryNotificationService : IInventoryNotificationService
{
    private readonly IHubContext<InventoryHub> _hubContext;

    public InventoryNotificationService(IHubContext<InventoryHub> hubContext)
    {
        _hubContext = hubContext;
    }

    // Broadcast pergerakan stok ke seluruh client yang sedang online
    public async Task BroadcastStockMovementAsync(StockMovementDto movement)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveStockMovement", movement);
    }

    // Broadcast perubahan sisa stok produk tertentu
    public async Task BroadcastProductStockUpdateAsync(long productId, int newStock, string status)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveProductStockUpdate", new
        {
            productId,
            newStock,
            status,
            updatedAt = DateTime.UtcNow
        });
    }
}
```

#### 3. Endpoint Mapping & Auth Query Token di `Program.cs`
WebSocket browser standar tidak mendukung header custom `Authorization: Bearer <token>` saat handshake awal. Maka token dikirim via query string `?access_token=...`:
```csharp
// Di Program.cs:
builder.Services.AddSignalR();
app.MapHub<InventoryHub>("/hubs/inventory");

// Handshake Token Extractor:
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        var accessToken = context.Request.Query["access_token"];
        var path = context.HttpContext.Request.Path;
        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
        {
            context.Token = accessToken;
        }
        return Task.CompletedTask;
    }
};
```

---

### 4.2 Konsumsi SignalR di Frontend React / Next.js

Frontend menggunakan library resmi `@microsoft/signalr`.

File `fe-react/src/lib/socket/inventory-socket-context.tsx`:
```tsx
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr"

const connection = new HubConnectionBuilder()
  .withUrl(`${getApiBaseUrl()}/hubs/inventory`, {
    accessTokenFactory: () => localStorage.getItem("inventory_auth_token") || "",
  })
  .withAutomaticReconnect([0, 2000, 5000, 10000]) // Otomatis re-connect jika sinyal putus
  .configureLogging(LogLevel.Warning)
  .build()

// Mulai koneksi
await connection.start()

// Dengarkan event dari backend
connection.on("ReceiveStockMovement", (movementEvent) => {
  toast.info(`Mutasi baru dicatat: ${movementEvent.productName} (${movementEvent.quantity} unit)`)
})

connection.on("ReceiveProductStockUpdate", (updateEvent) => {
  // Update state tabel produk secara real-time tanpa reload!
  updateLocalProductStock(updateEvent.productId, updateEvent.newStock)
})
```

---

## 5. Tutorial Praktik CRUD Lengkap: Modul Supplier (Pemasok)

Berikut adalah panduan langkah-demi-langkah membangun fitur CRUD dari backend hingga frontend dengan standar Clean Architecture.

```
[Domain] Entity ──▶ [Application] DTO & Service ──▶ [Infrastructure] DbContext ──▶ [API] Controller ──▶ [React] UI
```

---

### 5.1 Tahap 1: Domain Layer
Buat file `be-net/src/Inventory.Domain/Entities/Supplier.cs`:
```csharp
namespace Inventory.Domain.Entities;

public class Supplier
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
```

---

### 5.2 Tahap 2: Application Layer (DTO & Service Contract)

1. **Buat DTO** di `be-net/src/Inventory.Application/DTOs/Supplier/SupplierDto.cs`:
```csharp
namespace Inventory.Application.DTOs.Supplier;

public record SupplierDto(
    long Id,
    string Code,
    string Name,
    string? ContactPerson,
    string? Phone,
    string? Email,
    string? Address,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateSupplierDto(
    string Code,
    string Name,
    string? ContactPerson,
    string? Phone,
    string? Email,
    string? Address
);

public record UpdateSupplierDto(
    string Name,
    string? ContactPerson,
    string? Phone,
    string? Email,
    string? Address,
    bool IsActive
);
```

2. **Buat Interface Service** di `be-net/src/Inventory.Application/Interfaces/ISupplierService.cs`:
```csharp
using Inventory.Application.DTOs.Common;
using Inventory.Application.DTOs.Supplier;

namespace Inventory.Application.Interfaces;

public interface ISupplierService
{
    Task<PagedResultDto<SupplierDto>> GetSuppliersAsync(string? search, int page = 1, int pageSize = 10);
    Task<SupplierDto?> GetByIdAsync(long id);
    Task<SupplierDto> CreateAsync(CreateSupplierDto dto);
    Task<SupplierDto> UpdateAsync(long id, UpdateSupplierDto dto);
    Task<bool> DeleteAsync(long id);
}
```

3. **Implementasi Service** di `be-net/src/Inventory.Application/Services/SupplierService.cs`:
```csharp
using Inventory.Application.DTOs.Common;
using Inventory.Application.DTOs.Supplier;
using Inventory.Application.Interfaces;
using Inventory.Domain.Entities;
using Inventory.Domain.Interfaces;

namespace Inventory.Application.Services;

public class SupplierService : ISupplierService
{
    private readonly IRepository<Supplier> _supplierRepo;
    private readonly IUnitOfWork _unitOfWork;

    public SupplierService(IRepository<Supplier> supplierRepo, IUnitOfWork unitOfWork)
    {
        _supplierRepo = supplierRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResultDto<SupplierDto>> GetSuppliersAsync(string? search, int page = 1, int pageSize = 10)
    {
        var all = await _supplierRepo.GetAllAsync();
        var query = all.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(s => s.Name.ToLower().Contains(term) || s.Code.ToLower().Contains(term));
        }

        var total = query.Count();
        var items = query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SupplierDto(s.Id, s.Code, s.Name, s.ContactPerson, s.Phone, s.Email, s.Address, s.IsActive, s.CreatedAt))
            .ToList();

        return new PagedResultDto<SupplierDto>(items, total, page, pageSize);
    }

    public async Task<SupplierDto?> GetByIdAsync(long id)
    {
        var s = await _supplierRepo.GetByIdAsync(id);
        return s == null ? null : new SupplierDto(s.Id, s.Code, s.Name, s.ContactPerson, s.Phone, s.Email, s.Address, s.IsActive, s.CreatedAt);
    }

    public async Task<SupplierDto> CreateAsync(CreateSupplierDto dto)
    {
        var supplier = new Supplier
        {
            Code = dto.Code.Trim().ToUpper(),
            Name = dto.Name.Trim(),
            ContactPerson = dto.ContactPerson,
            Phone = dto.Phone,
            Email = dto.Email,
            Address = dto.Address,
            CreatedAt = DateTime.UtcNow
        };

        await _supplierRepo.AddAsync(supplier);
        await _unitOfWork.SaveChangesAsync();

        return new SupplierDto(supplier.Id, supplier.Code, supplier.Name, supplier.ContactPerson, supplier.Phone, supplier.Email, supplier.Address, supplier.IsActive, supplier.CreatedAt);
    }

    public async Task<SupplierDto> UpdateAsync(long id, UpdateSupplierDto dto)
    {
        var supplier = await _supplierRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Supplier tidak ditemukan.");

        supplier.Name = dto.Name.Trim();
        supplier.ContactPerson = dto.ContactPerson;
        supplier.Phone = dto.Phone;
        supplier.Email = dto.Email;
        supplier.Address = dto.Address;
        supplier.IsActive = dto.IsActive;
        supplier.UpdatedAt = DateTime.UtcNow;

        await _supplierRepo.UpdateAsync(supplier);
        await _unitOfWork.SaveChangesAsync();

        return new SupplierDto(supplier.Id, supplier.Code, supplier.Name, supplier.ContactPerson, supplier.Phone, supplier.Email, supplier.Address, supplier.IsActive, supplier.CreatedAt);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var supplier = await _supplierRepo.GetByIdAsync(id);
        if (supplier == null) return false;

        await _supplierRepo.DeleteAsync(supplier);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
}
```

---

### 5.3 Tahap 3: Infrastructure Layer
1. Daftarkan di `ApplicationDbContext.cs` (seperti di [Seksi 2.2](#langkah-2-daftarkan-di-applicationdbcontext--fluent-api)).
2. Daftarkan Service di `DependencyInjection.cs`:
```csharp
services.AddScoped<ISupplierService, SupplierService>();
```
3. Buat dan jalankan migrasi EF Core:
```powershell
dotnet ef migrations add AddSupplierTable -p src/Inventory.Infrastructure -s src/Inventory.Api
dotnet ef database update -p src/Inventory.Infrastructure -s src/Inventory.Api
```

---

### 5.4 Tahap 4: API Presentation Layer
Buat file `be-net/src/Inventory.Api/Controllers/SuppliersController.cs`:
```csharp
using Inventory.Application.DTOs.Common;
using Inventory.Application.DTOs.Supplier;
using Inventory.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Wajib login JWT
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;

    public SuppliersController(ISupplierService supplierService)
    {
        _supplierService = supplierService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResultDto<SupplierDto>>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _supplierService.GetSuppliersAsync(search, page, pageSize);
        return Ok(ApiResponse<PagedResultDto<SupplierDto>>.SuccessResult(result));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<SupplierDto>>> GetById(long id)
    {
        var result = await _supplierService.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<SupplierDto>.FailureResult("Data tidak ditemukan"));
        return Ok(ApiResponse<SupplierDto>.SuccessResult(result));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<SupplierDto>>> Create([FromBody] CreateSupplierDto dto)
    {
        var result = await _supplierService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<SupplierDto>.SuccessResult(result, "Supplier berhasil ditambahkan"));
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<SupplierDto>>> Update(long id, [FromBody] UpdateSupplierDto dto)
    {
        var result = await _supplierService.UpdateAsync(id, dto);
        return Ok(ApiResponse<SupplierDto>.SuccessResult(result, "Supplier berhasil diperbarui"));
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "Admin")] // Hanya Admin yang boleh menghapus
    public async Task<ActionResult<ApiResponse<bool>>> Delete(long id)
    {
        var success = await _supplierService.DeleteAsync(id);
        if (!success) return NotFound(ApiResponse<bool>.FailureResult("Supplier tidak ditemukan"));
        return Ok(ApiResponse<bool>.SuccessResult(true, "Supplier berhasil dihapus"));
    }
}
```

---

### 5.5 Tahap 5: Frontend React / Next.js

1. **Definisi Type** di `fe-react/src/types/supplier.types.ts`:
```typescript
export interface Supplier {
  id: number
  code: string
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  isActive: boolean
  createdAt: string
}

export interface CreateSupplierPayload {
  code: string
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
}
```

2. **API Service Call** di `fe-react/src/features/suppliers/services/supplier.service.ts`:
```typescript
import { apiClient } from "@/lib/api/client"
import type { ApiResponse, PagedResult, Supplier, CreateSupplierPayload } from "@/types"

export const supplierService = {
  getAll: (search?: string, page = 1, pageSize = 10) =>
    apiClient.get<ApiResponse<PagedResult<Supplier>>>("/api/suppliers", {
      params: { search, page, pageSize },
    }),

  create: (data: CreateSupplierPayload) =>
    apiClient.post<ApiResponse<Supplier>>("/api/suppliers", data),

  update: (id: number, data: Partial<CreateSupplierPayload>) =>
    apiClient.put<ApiResponse<Supplier>>(`/api/suppliers/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/api/suppliers/${id}`),
}
```

3. **Halaman UI**: Buat rute baru di Next.js App Router `fe-react/src/app/dashboard/suppliers/page.tsx` membungkus dengan `<DashboardShell title="Manajemen Pemasok (Supplier)">` lengkap dengan table responsif, filter card, dan modal pop-up!

---

## 6. Daftar Perintah Penting (Cheat Sheet)

### EF Core CLI Commands
| Perintah | Fungsi |
| :--- | :--- |
| `dotnet ef migrations add <Nama>` | Membuat file migrasi baru berdasarkan perubahan entity |
| `dotnet ef database update` | Menjalankan seluruh migrasi yang belum terpasang ke database |
| `dotnet ef migrations list` | Menampilkan riwayat migrasi yang sudah dan belum diaplikasikan |
| `dotnet ef migrations remove` | Menghapus migrasi terakhir (hanya jika belum diaplikasikan ke DB) |
| `dotnet ef database update 0` | Mengembalikan database ke keadaan kosong awal (Revert all) |

### Docker & Redis Commands
| Perintah | Fungsi |
| :--- | :--- |
| `docker compose up -d` | Menjalankan kontainer Oracle, Redis, Backend, dan Frontend di background |
| `docker exec -it inventory_redis redis-cli` | Masuk ke interaktif CLI Redis |
| `KEYS *` (di redis-cli) | Melihat seluruh key di Redis (termasuk distributed lock dan cache) |
| `GET <key>` (di redis-cli) | Melihat isi value data cache |
| `FLUSHALL` (di redis-cli) | Membersihkan seluruh cache Redis |

---
*Dokumen ini dibuat untuk tim pengembang InventoryNet. Jika ada pertanyaan lebih lanjut mengenai implementasi arsitektur atau optimasi performa, silakan merujuk pada kode sumber yang tersedia.*
