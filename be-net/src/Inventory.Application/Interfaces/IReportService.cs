using Inventory.Application.Common;
using Inventory.Application.DTOs.Report;

namespace Inventory.Application.Interfaces;

public interface IReportService
{
    Task<ApiResponse<IReadOnlyList<StockReportDto>>> GetStockSummaryReportsAsync(DateTime? date = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<IReadOnlyList<StockReportDto>>> GetPagedStockSummaryReportsAsync(DateTime? date = null, string? search = null, int pageNumber = 1, int pageSize = 10, CancellationToken cancellationToken = default);
}
