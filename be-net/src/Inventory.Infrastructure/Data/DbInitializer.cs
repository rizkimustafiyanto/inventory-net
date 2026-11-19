using Inventory.Application.Interfaces;
using Inventory.Domain.Entities;
using Inventory.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        // Creates tables if they don't exist; ignore if already created in Oracle
        try
        {
            await context.Database.EnsureCreatedAsync();
        }
        catch (Exception ex) when (ex.Message.Contains("ORA-00955") || ex.ToString().Contains("ORA-00955"))
        {
            // Table already exists in Oracle, safe to continue
        }

        // 1. Seed Users
        if (!await context.Users.AnyAsync())
        {
            var adminUser = new User
            {
                Username = "admin",
                Email = "admin@inventory.local",
                FullName = "Administrator",
                PasswordHash = passwordHasher.HashPassword("admin123"),
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var staffUser = new User
            {
                Username = "staff",
                Email = "staff@inventory.local",
                FullName = "Staff Gudang",
                PasswordHash = passwordHasher.HashPassword("staff123"),
                Role = UserRole.Staff,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var managerUser = new User
            {
                Username = "manager",
                Email = "manager@inventory.local",
                FullName = "Supervisor / Auditor",
                PasswordHash = passwordHasher.HashPassword("manager123"),
                Role = UserRole.Manager,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await context.Users.AddRangeAsync(adminUser, staffUser, managerUser);
            await context.SaveChangesAsync();
        }

        // 2. Seed Categories
        if (!await context.Categories.AnyAsync())
        {
            var catElec = new Category
            {
                Name = "Elektronik & Gadget",
                Description = "Peralatan elektronik, komputer, dan aksesoris",
                CreatedAt = DateTime.UtcNow
            };

            var catOffice = new Category
            {
                Name = "Alat Tulis Kantor (ATK)",
                Description = "Kertas, pulpen, map, dan perlengkapan kantor",
                CreatedAt = DateTime.UtcNow
            };

            var catParts = new Category
            {
                Name = "Sparepart & Komponen",
                Description = "Komponen mesin, kabel, baut dan perkakas",
                CreatedAt = DateTime.UtcNow
            };

            await context.Categories.AddRangeAsync(catElec, catOffice, catParts);
            await context.SaveChangesAsync();

            // 3. Seed Products
            var prod1 = new Product
            {
                Sku = "ELEC-LOGI-M100",
                Name = "Mouse Wireless Logitech M100",
                Description = "Optical wireless mouse 2.4Ghz",
                Price = 145000,
                StockQuantity = 25,
                MinStockLevel = 5,
                CategoryId = catElec.Id,
                CreatedAt = DateTime.UtcNow
            };

            var prod2 = new Product
            {
                Sku = "ELEC-KB-MECH",
                Name = "Keyboard Mechanical RGB",
                Description = "Tenkeyless Blue Switch mechanical keyboard",
                Price = 380000,
                StockQuantity = 8,
                MinStockLevel = 3,
                CategoryId = catElec.Id,
                CreatedAt = DateTime.UtcNow
            };

            var prod3 = new Product
            {
                Sku = "ATK-PPR-A4",
                Name = "Kertas HVS A4 80gr PaperOne",
                Description = "1 Rim / 500 lembar warna putih bersih",
                Price = 52000,
                StockQuantity = 3, // Low stock sample!
                MinStockLevel = 10,
                CategoryId = catOffice.Id,
                CreatedAt = DateTime.UtcNow
            };

            var prod4 = new Product
            {
                Sku = "ATK-PEN-SNOW",
                Name = "Pulpen Snowman V-1 Hitam",
                Description = "1 Box isi 12 pcs pulpen gel 0.5mm",
                Price = 28000,
                StockQuantity = 0, // Out of stock sample!
                MinStockLevel = 5,
                CategoryId = catOffice.Id,
                CreatedAt = DateTime.UtcNow
            };

            await context.Products.AddRangeAsync(prod1, prod2, prod3, prod4);
            await context.SaveChangesAsync();

            // 4. Seed Stock Movements
            var movements = new List<StockMovement>
            {
                new() { ProductId = prod1.Id, Type = StockMovementType.In, Quantity = 25, StockBefore = 0, StockAfter = 25, Reason = "Saldo Awal", CreatedAt = DateTime.UtcNow },
                new() { ProductId = prod2.Id, Type = StockMovementType.In, Quantity = 8, StockBefore = 0, StockAfter = 8, Reason = "Saldo Awal", CreatedAt = DateTime.UtcNow },
                new() { ProductId = prod3.Id, Type = StockMovementType.In, Quantity = 3, StockBefore = 0, StockAfter = 3, Reason = "Saldo Awal", CreatedAt = DateTime.UtcNow },
                new() { ProductId = prod4.Id, Type = StockMovementType.Out, Quantity = 10, StockBefore = 10, StockAfter = 0, Reason = "Pengambilan Divisi Keuangan", CreatedAt = DateTime.UtcNow }
            };

            await context.StockMovements.AddRangeAsync(movements);
            await context.SaveChangesAsync();

            // 5. Seed Initial Report Snapshot (r_stock_summary)
            if (!await context.StockReports.AnyAsync())
            {
                var reports = new List<StockReport>
                {
                    new()
                    {
                        ReportDate = DateTime.UtcNow.Date,
                        ProductId = prod1.Id,
                        ProductSku = prod1.Sku,
                        ProductName = prod1.Name,
                        CategoryName = catElec.Name,
                        OpeningStock = 0,
                        TotalIn = 25,
                        TotalOut = 0,
                        ClosingStock = 25,
                        UnitPrice = prod1.Price,
                        TotalStockValue = prod1.Price * 25,
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        ReportDate = DateTime.UtcNow.Date,
                        ProductId = prod2.Id,
                        ProductSku = prod2.Sku,
                        ProductName = prod2.Name,
                        CategoryName = catElec.Name,
                        OpeningStock = 0,
                        TotalIn = 8,
                        TotalOut = 0,
                        ClosingStock = 8,
                        UnitPrice = prod2.Price,
                        TotalStockValue = prod2.Price * 8,
                        CreatedAt = DateTime.UtcNow
                    }
                };

                await context.StockReports.AddRangeAsync(reports);
                await context.SaveChangesAsync();
            }
        }
    }
}
