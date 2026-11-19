using Inventory.Domain.Common;

namespace Inventory.Domain.Entities;

public class StockReport : BaseEntity
{
    public DateTime ReportDate { get; set; } = DateTime.UtcNow.Date;
    public long ProductId { get; set; }
    public string ProductSku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int OpeningStock { get; set; }
    public int TotalIn { get; set; }
    public int TotalOut { get; set; }
    public int ClosingStock { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalStockValue { get; set; }
}
