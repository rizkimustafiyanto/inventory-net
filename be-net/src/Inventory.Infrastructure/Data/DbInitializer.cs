using System.Data;
using Inventory.Application.Interfaces;
using Inventory.Domain.Entities;
using Inventory.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

namespace Inventory.Infrastructure.Data;

public static class DbInitializer
{
    private static readonly string[] LegacyEnsureCreatedBaselineMigrations =
    [
        "20261119041229_InitialCreate",
        "20261123043614_AddAvatarUrlToUser"
    ];

    public static async Task InitializeAsync(
        ApplicationDbContext context,
        IPasswordHasher passwordHasher,
        ILogger? logger = null,
        string? orphanedMigrationPolicy = null,
        CancellationToken cancellationToken = default)
    {
        var policy = NormalizePolicy(orphanedMigrationPolicy);

        if (!context.Database.IsRelational())
        {
            await context.Database.EnsureCreatedAsync(cancellationToken);
        }
        else
        {
            await EnsureLegacyDatabaseBaselinedAsync(context, logger, cancellationToken);
            await EnforceOrphanedMigrationGuardAsync(context, policy, logger, cancellationToken);

            logger?.LogInformation("Applying pending EF Core migrations (if any)...");
            await context.Database.MigrateAsync(cancellationToken);
            logger?.LogInformation("EF Core migrations are up to date.");
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

    private static string NormalizePolicy(string? orphanedMigrationPolicy)
    {
        var normalized = string.IsNullOrWhiteSpace(orphanedMigrationPolicy)
            ? "strict"
            : orphanedMigrationPolicy.Trim().ToLowerInvariant();

        return normalized switch
        {
            "strict" or "allow_once" or "prune_history" => normalized,
            _ => throw new MigrationGuardException(
                $"Invalid DatabaseMigration:OrphanedMigrationPolicy '{orphanedMigrationPolicy}'. " +
                "Allowed values: 'strict', 'allow_once', 'prune_history'.")
        };
    }

    /// <summary>
    /// Safely transitions existing Oracle databases previously created with EnsureCreatedAsync()
    /// to EF Core Migrations by creating __EFMigrationsHistory and recording the baseline migrations
    /// so MigrateAsync() does not fail with ORA-00955 on existing tables.
    /// </summary>
    private static async Task EnsureLegacyDatabaseBaselinedAsync(
        ApplicationDbContext context,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        var historyRepository = context.GetService<IHistoryRepository>();
        if (await historyRepository.ExistsAsync(cancellationToken))
        {
            return;
        }

        if (!await TableExistsAsync(context, "m_user", cancellationToken))
        {
            return;
        }

        logger?.LogWarning(
            "Existing schema detected without __EFMigrationsHistory (created via EnsureCreated). " +
            "Running one-time EF Core migration baselining...");

        // Ensure legacy column added prior to MigrateAsync adoption exists before marking AddAvatarUrlToUser as applied
        try
        {
            await context.Database.ExecuteSqlRawAsync(
                "ALTER TABLE \"m_user\" ADD \"AvatarUrl\" VARCHAR2(500) NULL",
                cancellationToken);
        }
        catch
        {
            // Column already exists, safe to continue
        }

        await context.Database.ExecuteSqlRawAsync(
            historyRepository.GetCreateIfNotExistsScript(),
            cancellationToken);

        var codeMigrations = context.Database.GetMigrations().ToHashSet(StringComparer.Ordinal);
        var productVersion = typeof(DbContext).Assembly.GetName().Version?.ToString(3) ?? "8.0.8";

        foreach (var baselineId in LegacyEnsureCreatedBaselineMigrations)
        {
            if (!codeMigrations.Contains(baselineId))
            {
                continue;
            }

            var existsCount = await ExecuteScalarIntAsync(
                context,
                "SELECT COUNT(*) FROM \"__EFMigrationsHistory\" WHERE \"MigrationId\" = :migrationId",
                [("migrationId", baselineId)],
                cancellationToken);

            if (existsCount == 0)
            {
                await context.Database.ExecuteSqlRawAsync(
                    "INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ({0}, {1})",
                    [baselineId, productVersion],
                    cancellationToken);

                logger?.LogInformation("Baselined existing database with migration {MigrationId}.", baselineId);
            }
        }
    }

    private static async Task EnforceOrphanedMigrationGuardAsync(
        ApplicationDbContext context,
        string policy,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        var historyRepository = context.GetService<IHistoryRepository>();
        if (!await historyRepository.ExistsAsync(cancellationToken))
        {
            return;
        }

        var appliedMigrations = (await context.Database.GetAppliedMigrationsAsync(cancellationToken)).ToList();
        var codeMigrations = context.Database.GetMigrations().ToHashSet(StringComparer.Ordinal);
        var orphanedMigrations = appliedMigrations
            .Where(migrationId => !codeMigrations.Contains(migrationId))
            .ToList();

        if (orphanedMigrations.Count == 0)
        {
            return;
        }

        var orphanedList = string.Join(", ", orphanedMigrations);

        switch (policy)
        {
            case "strict":
                throw new MigrationGuardException(
                    $"[MIGRATION GUARD BLOCKED] Database already has applied migration(s) missing from application code: [{orphanedList}]. " +
                    "Refusing to boot to prevent schema drift / production corruption. " +
                    "Recovery options: " +
                    "(1) Recommended: restore the migration file(s) from Git and create a forward corrective migration (dotnet ef migrations add Revert_...); " +
                    "(2) Restore database from pre-deploy backup via Database Restore workflow; " +
                    "(3) Emergency bypass via manual workflow_dispatch with orphaned_migration_policy='allow_once' or 'prune_history' (only after verifying DB schema matches ModelSnapshot).");

            case "allow_once":
                logger?.LogWarning(
                    "[MIGRATION AUDIT WARNING] Orphaned migration(s) detected in DB [{OrphanedMigrations}], " +
                    "but startup is continuing because policy is 'allow_once'. " +
                    "Remember: subsequent normal deployments ('strict') will remain blocked until history or migrations are reconciled.",
                    orphanedList);
                break;

            case "prune_history":
                logger?.LogWarning(
                    "[MIGRATION AUDIT] Policy is 'prune_history'. Removing orphaned migration record(s) from __EFMigrationsHistory: [{OrphanedMigrations}]...",
                    orphanedList);

                await using (var tx = await context.Database.BeginTransactionAsync(cancellationToken))
                {
                    foreach (var migrationId in orphanedMigrations)
                    {
                        await context.Database.ExecuteSqlRawAsync(
                            "DELETE FROM \"__EFMigrationsHistory\" WHERE \"MigrationId\" = {0}",
                            [migrationId],
                            cancellationToken);

                        logger?.LogWarning(
                            "[MIGRATION AUDIT] Deleted orphaned migration record '{MigrationId}' from __EFMigrationsHistory.",
                            migrationId);
                    }

                    await tx.CommitAsync(cancellationToken);
                }
                break;
        }
    }

    private static async Task<bool> TableExistsAsync(
        ApplicationDbContext context,
        string tableName,
        CancellationToken cancellationToken)
    {
        var count = await ExecuteScalarIntAsync(
            context,
            "SELECT COUNT(*) FROM USER_TABLES WHERE UPPER(TABLE_NAME) = :tableName",
            [("tableName", tableName.ToUpperInvariant())],
            cancellationToken);

        return count > 0;
    }

    private static async Task<int> ExecuteScalarIntAsync(
        ApplicationDbContext context,
        string sql,
        IReadOnlyList<(string Name, object Value)> parameters,
        CancellationToken cancellationToken)
    {
        var connection = context.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose)
        {
            await connection.OpenAsync(cancellationToken);
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            command.Transaction = context.Database.CurrentTransaction?.GetDbTransaction();
            foreach (var (name, value) in parameters)
            {
                var param = command.CreateParameter();
                param.ParameterName = name;
                param.Value = value;
                command.Parameters.Add(param);
            }

            var result = await command.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(result);
        }
        finally
        {
            if (shouldClose)
            {
                await connection.CloseAsync();
            }
        }
    }
}
