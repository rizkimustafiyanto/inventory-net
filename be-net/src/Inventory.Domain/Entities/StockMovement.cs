using Inventory.Domain.Common;
using Inventory.Domain.Enums;

namespace Inventory.Domain.Entities;

public class StockMovement : BaseEntity
{
    public long ProductId { get; set; }
    public Product? Product { get; set; }

    public StockMovementType Type { get; set; }
    public int Quantity { get; set; }
    public int StockBefore { get; set; }
    public int StockAfter { get; set; }
    public string? Reason { get; set; }
    public string? ReferenceNumber { get; set; } // e.g. PO-1234 or INV-5678

    public long? UserId { get; set; }
    public User? User { get; set; }
}
