using System.Linq.Expressions;
using Inventory.Application.Common;
using Inventory.Application.DTOs.Product;
using Inventory.Application.Interfaces;
using Inventory.Domain.Entities;
using Inventory.Domain.Enums;
using Inventory.Domain.Interfaces;

namespace Inventory.Application.Services;

public class ProductService : IProductService
{
    private const int DefaultProductPageSize = 10;
    private const int MaxProductPageSize = 100;

    private readonly IUnitOfWork _unitOfWork;

    public ProductService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<IReadOnlyList<ProductDto>>> GetPagedProductsAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? search = null,
        long? categoryId = null,
        bool? lowStockOnly = null,
        CancellationToken cancellationToken = default)
    {
        // Enforce pagination boundaries and hard maximum limit
        pageNumber = pageNumber <= 0 ? 1 : pageNumber;
        pageSize = Math.Clamp(pageSize <= 0 ? DefaultProductPageSize : pageSize, 1, MaxProductPageSize);

        var searchClean = string.IsNullOrWhiteSpace(search) ? null : search.Trim().ToLower();
        var filterCategoryId = categoryId.HasValue && categoryId.Value > 0 ? categoryId.Value : (long?)null;
        var filterLowStock = lowStockOnly == true;

        Expression<Func<Product, bool>>? predicate = null;
        if (searchClean != null || filterCategoryId != null || filterLowStock)
        {
            predicate = p =>
                (searchClean == null || p.Name.ToLower().Contains(searchClean) || p.Sku.ToLower().Contains(searchClean)) &&
                (filterCategoryId == null || p.CategoryId == filterCategoryId.Value) &&
                (!filterLowStock || p.StockQuantity <= p.MinStockLevel);
        }

        var (items, totalCount) = await _unitOfWork.Products.GetPagedAsync(
            predicate: predicate,
            pageNumber: pageNumber,
            pageSize: pageSize,
            orderBy: q => q.OrderByDescending(p => p.CreatedAt),
            cancellationToken: cancellationToken,
            includes: p => p.Category!);

        var dtos = items.Select(p => new ProductDto
        {
            Id = p.Id,
            Sku = p.Sku,
            Name = p.Name,
            Description = p.Description,
            Price = p.Price,
            StockQuantity = p.StockQuantity,
            MinStockLevel = p.MinStockLevel,
            CategoryId = p.CategoryId,
            CategoryName = p.Category != null ? p.Category.Name : "General",
            CreatedAt = p.CreatedAt
        }).ToList();

        var result = new PagedResult<ProductDto>(dtos, totalCount, pageNumber, pageSize);
        return ApiResponse<IReadOnlyList<ProductDto>>.Ok(result.Items, "Success", result.Meta);
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
