using System.Linq.Expressions;
using Inventory.Application.Common;
using Inventory.Application.DTOs.Category;
using Inventory.Application.Interfaces;
using Inventory.Domain.Entities;
using Inventory.Domain.Interfaces;

namespace Inventory.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly IUnitOfWork _unitOfWork;

    public CategoryService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<IReadOnlyList<CategoryDto>>> GetAllCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var categories = await _unitOfWork.Categories.GetAllAsync(cancellationToken);
        var products = await _unitOfWork.Products.GetAllAsync(cancellationToken);

        var productCounts = products
            .GroupBy(p => p.CategoryId)
            .ToDictionary(g => g.Key, g => g.Count());

        var dtos = categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            ProductCount = productCounts.TryGetValue(c.Id, out var count) ? count : 0,
            CreatedAt = c.CreatedAt
        }).ToList();

        return ApiResponse<IReadOnlyList<CategoryDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<IReadOnlyList<CategoryDto>>> GetPagedCategoriesAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        pageNumber = pageNumber <= 0 ? 1 : pageNumber;
        pageSize = Math.Clamp(pageSize <= 0 ? 10 : pageSize, 1, 100);

        var searchClean = string.IsNullOrWhiteSpace(search) ? null : search.Trim().ToLower();
        Expression<Func<Category, bool>>? predicate = null;
        if (searchClean != null)
        {
            predicate = c => c.Name.ToLower().Contains(searchClean) ||
                             (c.Description != null && c.Description.ToLower().Contains(searchClean));
        }

        var (items, totalCount) = await _unitOfWork.Categories.GetPagedAsync(
            predicate: predicate,
            pageNumber: pageNumber,
            pageSize: pageSize,
            orderBy: q => q.OrderByDescending(c => c.CreatedAt),
            cancellationToken: cancellationToken);

        var categoryIds = items.Select(c => c.Id).ToList();
        var products = await _unitOfWork.Products.FindAsync(p => categoryIds.Contains(p.CategoryId), cancellationToken);
        var productCounts = products
            .GroupBy(p => p.CategoryId)
            .ToDictionary(g => g.Key, g => g.Count());

        var dtos = items.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            ProductCount = productCounts.TryGetValue(c.Id, out var count) ? count : 0,
            CreatedAt = c.CreatedAt
        }).ToList();

        var result = new PagedResult<CategoryDto>(dtos, totalCount, pageNumber, pageSize);
        return ApiResponse<IReadOnlyList<CategoryDto>>.Ok(result.Items, "Success", result.Meta);
    }

    public async Task<ApiResponse<CategoryDto>> GetCategoryByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
        if (category == null)
            return ApiResponse<CategoryDto>.Fail("Category not found");

        var products = await _unitOfWork.Products.FindAsync(p => p.CategoryId == id, cancellationToken);

        var dto = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ProductCount = products.Count,
            CreatedAt = category.CreatedAt
        };

        return ApiResponse<CategoryDto>.Ok(dto);
    }

    public async Task<ApiResponse<CategoryDto>> CreateCategoryAsync(CreateCategoryDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return ApiResponse<CategoryDto>.Fail("Category name is required");

        var existing = await _unitOfWork.Categories.FindAsync(c => c.Name.ToLower() == dto.Name.Trim().ToLower(), cancellationToken);
        if (existing.Any())
            return ApiResponse<CategoryDto>.Fail($"Category '{dto.Name}' already exists");

        var category = new Category
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Categories.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ProductCount = 0,
            CreatedAt = category.CreatedAt
        };

        return ApiResponse<CategoryDto>.Ok(result, "Category created successfully");
    }

    public async Task<ApiResponse<CategoryDto>> UpdateCategoryAsync(long id, UpdateCategoryDto dto, CancellationToken cancellationToken = default)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
        if (category == null)
            return ApiResponse<CategoryDto>.Fail("Category not found");

        if (string.IsNullOrWhiteSpace(dto.Name))
            return ApiResponse<CategoryDto>.Fail("Category name cannot be empty");

        category.Name = dto.Name.Trim();
        category.Description = dto.Description?.Trim();
        category.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Categories.Update(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            CreatedAt = category.CreatedAt
        };

        return ApiResponse<CategoryDto>.Ok(result, "Category updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteCategoryAsync(long id, CancellationToken cancellationToken = default)
    {
        var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
        if (category == null)
            return ApiResponse<bool>.Fail("Category not found");

        var products = await _unitOfWork.Products.FindAsync(p => p.CategoryId == id, cancellationToken);
        if (products.Any())
            return ApiResponse<bool>.Fail("Cannot delete category with associated products");

        _unitOfWork.Categories.Delete(category);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Category deleted successfully");
    }
}
