using Inventory.Api.Hubs;
using Inventory.Application.DTOs.Stock;
using Inventory.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Inventory.Api.Services;

public class InventoryNotificationService : IInventoryNotificationService
{
    private readonly IHubContext<InventoryHub> _hubContext;
    private readonly ILogger<InventoryNotificationService> _logger;

    public InventoryNotificationService(
        IHubContext<InventoryHub> hubContext,
        ILogger<InventoryNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task BroadcastStockMovementAsync(StockMovementDto movement, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("ReceiveStockMovement", movement, cancellationToken);
            _logger.LogInformation("Broadcasted ReceiveStockMovement for Movement #{MovementId} ({Sku})", movement.Id, movement.ProductSku);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast ReceiveStockMovement via SignalR");
        }
    }

    public async Task BroadcastProductStockUpdateAsync(long productId, int newStock, string status, CancellationToken cancellationToken = default)
    {
        try
        {
            var payload = new
            {
                productId,
                newStock,
                status,
                updatedAt = DateTime.UtcNow
            };
            await _hubContext.Clients.All.SendAsync("ReceiveProductStockUpdate", payload, cancellationToken);
            _logger.LogInformation("Broadcasted ReceiveProductStockUpdate for Product #{ProductId}: {NewStock} ({Status})", productId, newStock, status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast ReceiveProductStockUpdate via SignalR");
        }
    }

    public async Task BroadcastLowStockAlertAsync(long productId, string sku, string name, int currentStock, int minStock, CancellationToken cancellationToken = default)
    {
        try
        {
            var alert = new
            {
                productId,
                sku,
                name,
                currentStock,
                minStock,
                isOutOfStock = currentStock <= 0,
                alertTime = DateTime.UtcNow
            };
            await _hubContext.Clients.All.SendAsync("ReceiveLowStockAlert", alert, cancellationToken);
            _logger.LogWarning("Broadcasted ReceiveLowStockAlert for Product #{ProductId} ({Sku}): {Stock} <= {Min}", productId, sku, currentStock, minStock);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast ReceiveLowStockAlert via SignalR");
        }
    }

    public async Task BroadcastUserAvatarUpdatedAsync(long userId, string avatarUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            var payload = new
            {
                userId,
                avatarUrl,
                updatedAt = DateTime.UtcNow
            };
            await _hubContext.Clients.All.SendAsync("ReceiveUserAvatarUpdated", payload, cancellationToken);
            _logger.LogInformation("Broadcasted ReceiveUserAvatarUpdated for User #{UserId}: {AvatarUrl}", userId, avatarUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast ReceiveUserAvatarUpdated via SignalR");
        }
    }
}
