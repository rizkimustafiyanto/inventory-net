using Inventory.Application.Common;
using Inventory.Application.DTOs.User;

namespace Inventory.Application.Interfaces;

public interface IUserService
{
    Task<ApiResponse<IReadOnlyList<UserDto>>> GetAllUsersAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> GetUserByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> CreateUserAsync(CreateUserDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> UpdateUserStatusAsync(long id, bool isActive, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteUserAsync(long id, CancellationToken cancellationToken = default);
}
