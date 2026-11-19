namespace Inventory.Application.DTOs.Product;

public class ProductDto
{
    public long Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public int MinStockLevel { get; set; }
    public bool IsLowStock => StockQuantity <= MinStockLevel;
    public long CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateProductDto
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int InitialStock { get; set; } = 0;
    public int MinStockLevel { get; set; } = 5;
    public long CategoryId { get; set; }
}

public class UpdateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int MinStockLevel { get; set; }
    public long CategoryId { get; set; }
}
