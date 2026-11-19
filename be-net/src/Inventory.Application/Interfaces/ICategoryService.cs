using Inventory.Application.Common;
using Inventory.Application.DTOs.Category;

namespace Inventory.Application.Interfaces;

public interface ICategoryService
{
    Task<ApiResponse<IReadOnlyList<CategoryDto>>> GetAllCategoriesAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<CategoryDto>> GetCategoryByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<ApiResponse<CategoryDto>> CreateCategoryAsync(CreateCategoryDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<CategoryDto>> UpdateCategoryAsync(long id, UpdateCategoryDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteCategoryAsync(long id, CancellationToken cancellationToken = default);
}
