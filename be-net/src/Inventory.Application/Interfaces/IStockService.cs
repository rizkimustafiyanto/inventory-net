using Inventory.Application.Common;
using Inventory.Application.DTOs.Stock;

namespace Inventory.Application.Interfaces;

public interface IStockService
{
    Task<ApiResponse<StockMovementDto>> RecordMovementAsync(CreateStockMovementDto dto, long? userId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<IReadOnlyList<StockMovementDto>>> GetMovementsAsync(long? productId = null, int? type = null, string? search = null, int pageNumber = 1, int pageSize = 15, CancellationToken cancellationToken = default);
    Task<ApiResponse<StockSummaryDto>> GetStockSummaryAsync(CancellationToken cancellationToken = default);
}
