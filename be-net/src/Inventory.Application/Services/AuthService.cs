using Inventory.Application.Common;
using Inventory.Application.DTOs.Auth;
using Inventory.Application.Interfaces;
using Inventory.Domain.Entities;
using Inventory.Domain.Interfaces;

namespace Inventory.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return ApiResponse<LoginResponseDto>.Fail("Username and password are required");

        var users = await _unitOfWork.Users.FindAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower(), cancellationToken);
        var user = users.FirstOrDefault();

        if (user == null || !user.IsActive)
            return ApiResponse<LoginResponseDto>.Fail("Invalid username or password");

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            return ApiResponse<LoginResponseDto>.Fail("Invalid username or password");

        var (token, expiresAt) = _jwtTokenGenerator.GenerateToken(user);

        var response = new LoginResponseDto
        {
            Token = token,
            UserId = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            ExpiresAt = expiresAt
        };

        return ApiResponse<LoginResponseDto>.Ok(response, "Login successful");
    }

    public async Task<ApiResponse<long>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return ApiResponse<long>.Fail("Username and password are required");

        var existingUser = await _unitOfWork.Users.FindAsync(
            u => u.Username.ToLower() == request.Username.Trim().ToLower() || u.Email.ToLower() == request.Email.Trim().ToLower(),
            cancellationToken);

        if (existingUser.Any())
            return ApiResponse<long>.Fail("Username or email already in use");

        var user = new User
        {
            Username = request.Username.Trim(),
            Email = request.Email.Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = string.IsNullOrWhiteSpace(request.FullName) ? request.Username : request.FullName.Trim(),
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Users.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<long>.Ok(user.Id, "User registered successfully");
    }
}
