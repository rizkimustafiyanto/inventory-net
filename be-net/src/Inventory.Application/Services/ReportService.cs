using Inventory.Application.Common;
using Inventory.Application.DTOs.Report;
using Inventory.Application.Interfaces;
using Inventory.Domain.Interfaces;

namespace Inventory.Application.Services;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<IReadOnlyList<StockReportDto>>> GetStockSummaryReportsAsync(DateTime? date = null, CancellationToken cancellationToken = default)
    {
        var targetDate = date?.Date ?? DateTime.UtcNow.Date;
        var reports = await _unitOfWork.StockReports.GetAllAsync(cancellationToken);

        var list = reports
            .OrderByDescending(r => r.ReportDate)
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
