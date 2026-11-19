using Inventory.Application.Common;
using Inventory.Application.DTOs.Auth;

namespace Inventory.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<long>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
}
