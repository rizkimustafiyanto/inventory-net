using Inventory.Application.Common;
using Inventory.Application.DTOs.Auth;

namespace Inventory.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<long>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<ForgotPasswordResponseDto>> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserProfileDto>> GetProfileAsync(long userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserProfileDto>> UpdateProfileAsync(long userId, UpdateProfileRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ChangePasswordAsync(long userId, ChangePasswordRequestDto request, CancellationToken cancellationToken = default);
}
