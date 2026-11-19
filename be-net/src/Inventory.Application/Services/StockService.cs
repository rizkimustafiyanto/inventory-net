using System.Linq.Expressions;
using Inventory.Application.Common;
using Inventory.Application.DTOs.Stock;
using Inventory.Application.Interfaces;
using Inventory.Domain.Entities;
using Inventory.Domain.Enums;
using Inventory.Domain.Interfaces;

namespace Inventory.Application.Services;

public class StockService : IStockService
{
    private const int DefaultMovementPageSize = 15;
    private const int MaxMovementPageSize = 100;

    private readonly IUnitOfWork _unitOfWork;

    public StockService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<StockMovementDto>> RecordMovementAsync(
        CreateStockMovementDto dto,
        long? userId = null,
        CancellationToken cancellationToken = default)
    {
        if (dto.Quantity < 0)
            return ApiResponse<StockMovementDto>.Fail("Quantity cannot be negative");

        var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId, cancellationToken);
        if (product == null)
            return ApiResponse<StockMovementDto>.Fail("Product not found");

        int stockBefore = product.StockQuantity;
        int stockAfter;

        switch (dto.Type)
        {
            case StockMovementType.In:
                if (dto.Quantity == 0)
                    return ApiResponse<StockMovementDto>.Fail("Quantity for stock in must be greater than zero");
                stockAfter = stockBefore + dto.Quantity;
                break;

            case StockMovementType.Out:
                if (dto.Quantity == 0)
                    return ApiResponse<StockMovementDto>.Fail("Quantity for stock out must be greater than zero");
                if (stockBefore < dto.Quantity)
                    return ApiResponse<StockMovementDto>.Fail($"Insufficient stock. Current stock is {stockBefore}, requested {dto.Quantity}");
                stockAfter = stockBefore - dto.Quantity;
                break;

            case StockMovementType.Adjustment:
                // Adjustment sets the actual physical stock quantity
                stockAfter = dto.Quantity;
                break;

            default:
                return ApiResponse<StockMovementDto>.Fail("Invalid stock movement type");
        }

        product.StockQuantity = stockAfter;
        product.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Products.Update(product);

        var movement = new StockMovement
        {
            ProductId = product.Id,
            Type = dto.Type,
            Quantity = dto.Quantity,
            StockBefore = stockBefore,
            StockAfter = stockAfter,
            Reason = dto.Reason?.Trim(),
            ReferenceNumber = dto.ReferenceNumber?.Trim(),
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.StockMovements.AddAsync(movement, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var user = userId.HasValue ? await _unitOfWork.Users.GetByIdAsync(userId.Value, cancellationToken) : null;

        var resultDto = new StockMovementDto
        {
            Id = movement.Id,
            ProductId = product.Id,
            ProductName = product.Name,
            ProductSku = product.Sku,
            Type = movement.Type,
            Quantity = movement.Quantity,
            StockBefore = movement.StockBefore,
            StockAfter = movement.StockAfter,
            Reason = movement.Reason,
            ReferenceNumber = movement.ReferenceNumber,
            UserName = user?.FullName ?? user?.Username ?? "System",
            CreatedAt = movement.CreatedAt
        };

        return ApiResponse<StockMovementDto>.Ok(resultDto, "Stock movement recorded successfully");
    }

    public async Task<ApiResponse<IReadOnlyList<StockMovementDto>>> GetMovementsAsync(
        long? productId = null,
        int pageNumber = 1,
        int pageSize = 15,
        CancellationToken cancellationToken = default)
    {
        // Enforce pagination boundaries and hard maximum limit
        pageNumber = pageNumber <= 0 ? 1 : pageNumber;
        pageSize = Math.Clamp(pageSize <= 0 ? DefaultMovementPageSize : pageSize, 1, MaxMovementPageSize);

        var filterProductId = productId.HasValue && productId.Value > 0 ? productId.Value : (long?)null;
        Expression<Func<StockMovement, bool>>? predicate = filterProductId.HasValue
            ? m => m.ProductId == filterProductId.Value
            : null;

        var (items, totalCount) = await _unitOfWork.StockMovements.GetPagedAsync(
            predicate: predicate,
            pageNumber: pageNumber,
            pageSize: pageSize,
            orderBy: q => q.OrderByDescending(m => m.CreatedAt),
            cancellationToken: cancellationToken,
            includes: new Expression<Func<StockMovement, object>>[] { m => m.Product!, m => m.User! });

        var dtos = items.Select(m => new StockMovementDto
        {
            Id = m.Id,
            ProductId = m.ProductId,
            ProductName = m.Product?.Name ?? "Unknown Product",
            ProductSku = m.Product?.Sku ?? string.Empty,
            Type = m.Type,
            Quantity = m.Quantity,
            StockBefore = m.StockBefore,
            StockAfter = m.StockAfter,
            Reason = m.Reason,
            ReferenceNumber = m.ReferenceNumber,
            UserName = m.User?.FullName ?? m.User?.Username ?? "System",
            CreatedAt = m.CreatedAt
        }).ToList();

        var result = new PagedResult<StockMovementDto>(dtos, totalCount, pageNumber, pageSize);
        return ApiResponse<IReadOnlyList<StockMovementDto>>.Ok(result.Items, "Success", result.Meta);
    }

    public async Task<ApiResponse<StockSummaryDto>> GetStockSummaryAsync(CancellationToken cancellationToken = default)
    {
        var totalProducts = await _unitOfWork.Products.CountAsync(null, cancellationToken);
        var totalItemsInStock = await _unitOfWork.Products.SumAsync(p => p.StockQuantity, null, cancellationToken);
        var lowStockCount = await _unitOfWork.Products.CountAsync(p => p.StockQuantity <= p.MinStockLevel && p.StockQuantity > 0, cancellationToken);
        var outOfStockCount = await _unitOfWork.Products.CountAsync(p => p.StockQuantity <= 0, cancellationToken);

        var summary = new StockSummaryDto
        {
            TotalProducts = totalProducts,
            TotalItemsInStock = totalItemsInStock,
            LowStockCount = lowStockCount,
            OutOfStockCount = outOfStockCount
        };

        return ApiResponse<StockSummaryDto>.Ok(summary);
    }
}
