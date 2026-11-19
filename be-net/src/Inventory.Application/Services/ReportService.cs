using Inventory.Application.Common;
using Inventory.Application.DTOs.Report;
using Inventory.Application.Interfaces;
using Inventory.Domain.Entities;
using Inventory.Domain.Enums;
using Inventory.Domain.Interfaces;

namespace Inventory.Application.Services;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<IReadOnlyList<StockReportDto>>> GetStockSummaryReportsAsync(
        DateTime? date = null,
        CancellationToken cancellationToken = default)
    {
        var targetDate = date?.Date ?? DateTime.UtcNow.Date;

        // Auto-sync / generate snapshot from m_product & t_stock_movement into r_stock_summary
        var products = await _unitOfWork.Products.GetAllAsync(cancellationToken);
        var categories = await _unitOfWork.Categories.GetAllAsync(cancellationToken);
        var categoryMap = categories.ToDictionary(c => c.Id, c => c.Name);
        var movements = await _unitOfWork.StockMovements.GetAllAsync(cancellationToken);
        var existingReports = await _unitOfWork.StockReports.GetAllAsync(cancellationToken);
        var existingMap = existingReports
            .Where(r => r.ReportDate.Date == targetDate)
            .ToDictionary(r => r.ProductId);

        foreach (var p in products)
        {
            var pMovements = movements.Where(m => m.ProductId == p.Id).ToList();
            int totalIn = pMovements.Where(m => m.Type == StockMovementType.In).Sum(m => m.Quantity);
            int totalOut = pMovements.Where(m => m.Type == StockMovementType.Out).Sum(m => m.Quantity);
            categoryMap.TryGetValue(p.CategoryId, out var catName);

            if (existingMap.TryGetValue(p.Id, out var existing))
            {
                existing.ProductName = p.Name;
                existing.ProductSku = p.Sku;
                existing.CategoryName = catName ?? "General";
                existing.TotalIn = totalIn;
                existing.TotalOut = totalOut;
                existing.ClosingStock = p.StockQuantity;
                existing.UnitPrice = p.Price;
                existing.TotalStockValue = p.Price * p.StockQuantity;
                existing.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.StockReports.Update(existing);
            }
            else
            {
                var newReport = new StockReport
                {
                    ReportDate = targetDate,
                    ProductId = p.Id,
                    ProductSku = p.Sku,
                    ProductName = p.Name,
                    CategoryName = catName ?? "General",
                    OpeningStock = Math.Max(0, p.StockQuantity - totalIn + totalOut),
                    TotalIn = totalIn,
                    TotalOut = totalOut,
                    ClosingStock = p.StockQuantity,
                    UnitPrice = p.Price,
                    TotalStockValue = p.Price * p.StockQuantity,
                    CreatedAt = DateTime.UtcNow
                };
                await _unitOfWork.StockReports.AddAsync(newReport, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedReports = await _unitOfWork.StockReports.GetAllAsync(cancellationToken);
        var list = updatedReports
            .Where(r => r.ReportDate.Date == targetDate)
            .OrderBy(r => r.ProductName)
            .Select(r => new StockReportDto
            {
                Id = r.Id,
                ReportDate = r.ReportDate,
                ProductId = r.ProductId,
                ProductSku = r.ProductSku,
                ProductName = r.ProductName,
                CategoryName = r.CategoryName,
                OpeningStock = r.OpeningStock,
                TotalIn = r.TotalIn,
                TotalOut = r.TotalOut,
                ClosingStock = r.ClosingStock,
                UnitPrice = r.UnitPrice,
                TotalStockValue = r.TotalStockValue,
                CreatedAt = r.CreatedAt
            })
            .ToList();

        return ApiResponse<IReadOnlyList<StockReportDto>>.Ok(list);
    }
}
