using Inventory.Domain.Enums;

namespace Inventory.Application.DTOs.Stock;

public class StockMovementDto
{
    public long Id { get; set; }
    public long ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public StockMovementType Type { get; set; }
    public string TypeName => Type.ToString();
    public int Quantity { get; set; }
    public int StockBefore { get; set; }
    public int StockAfter { get; set; }
    public string? Reason { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? UserName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateStockMovementDto
{
    public long ProductId { get; set; }
    public StockMovementType Type { get; set; }
    public int Quantity { get; set; }
    public string? Reason { get; set; }
    public string? ReferenceNumber { get; set; }
}

public class StockSummaryDto
{
    public int TotalProducts { get; set; }
    public int TotalItemsInStock { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
}
