using Inventory.Application.Common;
using Inventory.Application.DTOs.Stock;
using Inventory.Application.Interfaces;
using Inventory.Domain.Entities;
using Inventory.Domain.Enums;
using Inventory.Domain.Interfaces;

namespace Inventory.Application.Services;

public class StockService : IStockService
{
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

    public async Task<ApiResponse<PagedResult<StockMovementDto>>> GetMovementsAsync(
        long? productId = null,
        int pageNumber = 1,
        int pageSize = 15,
        CancellationToken cancellationToken = default)
    {
        var allMovements = await _unitOfWork.StockMovements.GetAllAsync(cancellationToken);
        var products = await _unitOfWork.Products.GetAllAsync(cancellationToken);
        var users = await _unitOfWork.Users.GetAllAsync(cancellationToken);

        var productMap = products.ToDictionary(p => p.Id);
        var userMap = users.ToDictionary(u => u.Id);

        var query = allMovements.AsEnumerable();

        if (productId.HasValue && productId.Value > 0)
        {
            query = query.Where(m => m.ProductId == productId.Value);
        }

        var totalCount = query.Count();
        var items = query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(m =>
            {
                productMap.TryGetValue(m.ProductId, out var prod);
                User? usr = null;
                if (m.UserId.HasValue) userMap.TryGetValue(m.UserId.Value, out usr);

                return new StockMovementDto
                {
                    Id = m.Id,
                    ProductId = m.ProductId,
                    ProductName = prod?.Name ?? "Unknown Product",
                    ProductSku = prod?.Sku ?? string.Empty,
                    Type = m.Type,
                    Quantity = m.Quantity,
                    StockBefore = m.StockBefore,
                    StockAfter = m.StockAfter,
                    Reason = m.Reason,
                    ReferenceNumber = m.ReferenceNumber,
                    UserName = usr?.FullName ?? usr?.Username ?? "System",
                    CreatedAt = m.CreatedAt
                };
            })
            .ToList();

        var result = new PagedResult<StockMovementDto>(items, totalCount, pageNumber, pageSize);
        return ApiResponse<PagedResult<StockMovementDto>>.Ok(result);
    }

    public async Task<ApiResponse<StockSummaryDto>> GetStockSummaryAsync(CancellationToken cancellationToken = default)
    {
        var products = await _unitOfWork.Products.GetAllAsync(cancellationToken);

        var summary = new StockSummaryDto
        {
            TotalProducts = products.Count,
            TotalItemsInStock = products.Sum(p => p.StockQuantity),
            LowStockCount = products.Count(p => p.StockQuantity <= p.MinStockLevel && p.StockQuantity > 0),
            OutOfStockCount = products.Count(p => p.StockQuantity <= 0)
        };

        return ApiResponse<StockSummaryDto>.Ok(summary);
    }
}
