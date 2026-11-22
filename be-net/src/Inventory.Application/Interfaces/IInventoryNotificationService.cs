using Inventory.Application.DTOs.Stock;

namespace Inventory.Application.Interfaces;

public interface IInventoryNotificationService
{
    Task BroadcastStockMovementAsync(StockMovementDto movement, CancellationToken cancellationToken = default);
    Task BroadcastProductStockUpdateAsync(long productId, int newStock, string status, CancellationToken cancellationToken = default);
    Task BroadcastLowStockAlertAsync(long productId, string sku, string name, int currentStock, int minStock, CancellationToken cancellationToken = default);
}
