using Inventory.Application.Common;
using Inventory.Application.DTOs.User;
using Inventory.Application.Interfaces;
using Inventory.Domain.Entities;
using Inventory.Domain.Enums;
using Inventory.Domain.Interfaces;

namespace Inventory.Application.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<ApiResponse<IReadOnlyList<UserDto>>> GetAllUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await _unitOfWork.Users.GetAllAsync(cancellationToken);
        var dtos = users
            .OrderBy(u => u.Id)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullName = u.FullName,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToList();

        return ApiResponse<IReadOnlyList<UserDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<UserDto>> GetUserByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id, cancellationToken);
        if (user == null)
            return ApiResponse<UserDto>.Fail("User not found");

        var dto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return ApiResponse<UserDto>.Ok(dto);
    }

    public async Task<ApiResponse<UserDto>> CreateUserAsync(CreateUserDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return ApiResponse<UserDto>.Fail("Username and password are required");

        var existing = await _unitOfWork.Users.FindAsync(
            u => u.Username.ToLower() == dto.Username.Trim().ToLower() || u.Email.ToLower() == dto.Email.Trim().ToLower(),
            cancellationToken);

        if (existing.Any())
            return ApiResponse<UserDto>.Fail("Username or email already exists");

        var user = new User
        {
            Username = dto.Username.Trim(),
            Email = dto.Email.Trim(),
            PasswordHash = _passwordHasher.HashPassword(dto.Password),
            FullName = string.IsNullOrWhiteSpace(dto.FullName) ? dto.Username.Trim() : dto.FullName.Trim(),
            Role = dto.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Users.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var resultDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return ApiResponse<UserDto>.Ok(resultDto, "User created successfully");
    }

    public async Task<ApiResponse<bool>> UpdateUserStatusAsync(long id, bool isActive, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id, cancellationToken);
        if (user == null)
            return ApiResponse<bool>.Fail("User not found");

        // Protect primary admin from being deactivated
        if (user.Username.Equals("admin", StringComparison.OrdinalIgnoreCase) && !isActive)
        {
            return ApiResponse<bool>.Fail("Primary administrator account cannot be deactivated");
        }

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, $"User status updated to {(isActive ? "Active" : "Inactive")}");
    }

    public async Task<ApiResponse<bool>> DeleteUserAsync(long id, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id, cancellationToken);
        if (user == null)
            return ApiResponse<bool>.Fail("User not found");

        // Protect primary admin from deletion
        if (user.Username.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            return ApiResponse<bool>.Fail("Primary administrator account cannot be deleted");
        }

        _unitOfWork.Users.Delete(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "User deleted successfully");
    }
}
