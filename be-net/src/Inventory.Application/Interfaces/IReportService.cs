using Inventory.Application.Common;
using Inventory.Application.DTOs.Report;

namespace Inventory.Application.Interfaces;

public interface IReportService
{
    Task<ApiResponse<IReadOnlyList<StockReportDto>>> GetStockSummaryReportsAsync(DateTime? date = null, CancellationToken cancellationToken = default);
}
