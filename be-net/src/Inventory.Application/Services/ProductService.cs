using Inventory.Application.Common;
using Inventory.Application.DTOs.Product;
using Inventory.Application.Interfaces;
using Inventory.Domain.Entities;
using Inventory.Domain.Enums;
using Inventory.Domain.Interfaces;

namespace Inventory.Application.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProductService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<PagedResult<ProductDto>>> GetPagedProductsAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? search = null,
        long? categoryId = null,
        bool? lowStockOnly = null,
        CancellationToken cancellationToken = default)
    {
        var allProducts = await _unitOfWork.Products.GetAllAsync(cancellationToken);
        var categories = await _unitOfWork.Categories.GetAllAsync(cancellationToken);
        var categoryMap = categories.ToDictionary(c => c.Id, c => c.Name);

        var query = allProducts.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.Sku.ToLower().Contains(s));
        }

        if (categoryId.HasValue && categoryId.Value > 0)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (lowStockOnly == true)
        {
            query = query.Where(p => p.StockQuantity <= p.MinStockLevel);
        }

        var totalCount = query.Count();
        var items = query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Sku = p.Sku,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                MinStockLevel = p.MinStockLevel,
                CategoryId = p.CategoryId,
                CategoryName = categoryMap.TryGetValue(p.CategoryId, out var cName) ? cName : "General",
                CreatedAt = p.CreatedAt
            })
            .ToList();

        var result = new PagedResult<ProductDto>(items, totalCount, pageNumber, pageSize);
        return ApiResponse<PagedResult<ProductDto>>.Ok(result);
    }

    public async Task<ApiResponse<ProductDto>> GetProductByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
        if (product == null)
        {
            return ApiResponse<ProductDto>.Fail("Product not found");
        }

        var category = await _unitOfWork.Categories.GetByIdAsync(product.CategoryId, cancellationToken);

        var dto = new ProductDto
        {
            Id = product.Id,
            Sku = product.Sku,
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            StockQuantity = product.StockQuantity,
            MinStockLevel = product.MinStockLevel,
            CategoryId = product.CategoryId,
            CategoryName = category?.Name ?? "General",
            CreatedAt = product.CreatedAt
        };

        return ApiResponse<ProductDto>.Ok(dto);
    }

    public async Task<ApiResponse<ProductDto>> CreateProductAsync(CreateProductDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Sku))
            return ApiResponse<ProductDto>.Fail("SKU is required");

        if (string.IsNullOrWhiteSpace(dto.Name))
            return ApiResponse<ProductDto>.Fail("Product name is required");

        if (dto.Price < 0)
            return ApiResponse<ProductDto>.Fail("Price must be greater than or equal to 0");

        var existingWithSku = await _unitOfWork.Products.FindAsync(p => p.Sku.ToLower() == dto.Sku.Trim().ToLower(), cancellationToken);
        if (existingWithSku.Any())
            return ApiResponse<ProductDto>.Fail($"Product with SKU '{dto.Sku}' already exists");

        var product = new Product
        {
            Sku = dto.Sku.Trim().ToUpper(),
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Price = dto.Price,
            StockQuantity = dto.InitialStock,
            MinStockLevel = dto.MinStockLevel,
            CategoryId = dto.CategoryId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Products.AddAsync(product, cancellationToken);

        if (dto.InitialStock > 0)
        {
            var movement = new StockMovement
            {
                Product = product,
                Type = StockMovementType.In,
                Quantity = dto.InitialStock,
                StockBefore = 0,
                StockAfter = dto.InitialStock,
                Reason = "Initial Stock",
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.StockMovements.AddAsync(movement, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var resultDto = new ProductDto
        {
            Id = product.Id,
            Sku = product.Sku,
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            StockQuantity = product.StockQuantity,
            MinStockLevel = product.MinStockLevel,
            CategoryId = product.CategoryId,
            CreatedAt = product.CreatedAt
        };

        return ApiResponse<ProductDto>.Ok(resultDto, "Product created successfully");
    }

    public async Task<ApiResponse<ProductDto>> UpdateProductAsync(long id, UpdateProductDto dto, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
        if (product == null)
            return ApiResponse<ProductDto>.Fail("Product not found");

        if (string.IsNullOrWhiteSpace(dto.Name))
            return ApiResponse<ProductDto>.Fail("Product name cannot be empty");

        product.Name = dto.Name.Trim();
        product.Description = dto.Description?.Trim();
        product.Price = dto.Price;
        product.MinStockLevel = dto.MinStockLevel;
        product.CategoryId = dto.CategoryId;
        product.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var category = await _unitOfWork.Categories.GetByIdAsync(product.CategoryId, cancellationToken);

        var resultDto = new ProductDto
        {
            Id = product.Id,
            Sku = product.Sku,
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            StockQuantity = product.StockQuantity,
            MinStockLevel = product.MinStockLevel,
            CategoryId = product.CategoryId,
            CategoryName = category?.Name ?? "General",
            CreatedAt = product.CreatedAt
        };

        return ApiResponse<ProductDto>.Ok(resultDto, "Product updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteProductAsync(long id, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
        if (product == null)
            return ApiResponse<bool>.Fail("Product not found");

        _unitOfWork.Products.Delete(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Product deleted successfully");
    }
}
