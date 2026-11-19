using Inventory.Application.Common;
using Inventory.Application.DTOs.Product;

namespace Inventory.Application.Interfaces;

public interface IProductService
{
    Task<ApiResponse<IReadOnlyList<ProductDto>>> GetPagedProductsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, long? categoryId = null, bool? lowStockOnly = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<ProductDto>> GetProductByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<ApiResponse<ProductDto>> CreateProductAsync(CreateProductDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ProductDto>> UpdateProductAsync(long id, UpdateProductDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteProductAsync(long id, CancellationToken cancellationToken = default);
}
