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

    public async Task<ApiResponse<ForgotPasswordResponseDto>> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.UsernameOrEmail))
            return ApiResponse<ForgotPasswordResponseDto>.Fail("Username atau Email wajib diisi");

        var term = request.UsernameOrEmail.Trim().ToLower();
        var users = await _unitOfWork.Users.FindAsync(
            u => u.Username.ToLower() == term || u.Email.ToLower() == term,
            cancellationToken);

        var user = users.FirstOrDefault();
        if (user == null || !user.IsActive)
            return ApiResponse<ForgotPasswordResponseDto>.Fail("Pengguna dengan username atau email tersebut tidak ditemukan");

        // Generate temporary reset token
        var resetToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).Replace("/", "_").Replace("+", "-").TrimEnd('=');

        var response = new ForgotPasswordResponseDto
        {
            Username = user.Username,
            Email = user.Email,
            ResetToken = resetToken,
            Message = $"Kode verifikasi reset password telah dibuat untuk akun {user.Username}"
        };

        return ApiResponse<ForgotPasswordResponseDto>.Ok(response, "Akun terverifikasi. Silakan masukkan password baru.");
    }

    public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.UsernameOrEmail) || string.IsNullOrWhiteSpace(request.NewPassword))
            return ApiResponse<bool>.Fail("Username/Email dan Password Baru wajib diisi");

        if (request.NewPassword.Length < 6)
            return ApiResponse<bool>.Fail("Password baru minimal 6 karakter");

        var term = request.UsernameOrEmail.Trim().ToLower();
        var users = await _unitOfWork.Users.FindAsync(
            u => u.Username.ToLower() == term || u.Email.ToLower() == term,
            cancellationToken);

        var user = users.FirstOrDefault();
        if (user == null || !user.IsActive)
            return ApiResponse<bool>.Fail("Pengguna tidak ditemukan");

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Password berhasil diperbarui. Silakan login dengan password baru.");
    }

    public async Task<ApiResponse<UserProfileDto>> GetProfileAsync(long userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null || !user.IsActive)
            return ApiResponse<UserProfileDto>.Fail("Pengguna tidak ditemukan");

        var dto = new UserProfileDto
        {
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        };

        return ApiResponse<UserProfileDto>.Ok(dto);
    }

    public async Task<ApiResponse<UserProfileDto>> UpdateProfileAsync(long userId, UpdateProfileRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null || !user.IsActive)
            return ApiResponse<UserProfileDto>.Fail("Pengguna tidak ditemukan");

        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email))
            return ApiResponse<UserProfileDto>.Fail("Nama lengkap dan email tidak boleh kosong");

        var emailTrimmed = request.Email.Trim().ToLower();
        if (emailTrimmed != user.Email.ToLower())
        {
            var existingWithEmail = await _unitOfWork.Users.FindAsync(
                u => u.Id != userId && u.Email.ToLower() == emailTrimmed,
                cancellationToken);

            if (existingWithEmail.Any())
                return ApiResponse<UserProfileDto>.Fail("Email sudah digunakan oleh akun lain");
        }

        user.FullName = request.FullName.Trim();
        user.Email = emailTrimmed;
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new UserProfileDto
        {
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        };

        return ApiResponse<UserProfileDto>.Ok(dto, "Profil berhasil diperbarui");
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(long userId, ChangePasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null || !user.IsActive)
            return ApiResponse<bool>.Fail("Pengguna tidak ditemukan");

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            return ApiResponse<bool>.Fail("Password lama dan baru wajib diisi");

        if (request.NewPassword.Length < 6)
            return ApiResponse<bool>.Fail("Password baru minimal 6 karakter");

        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            return ApiResponse<bool>.Fail("Password saat ini salah");

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Password berhasil diubah");
    }
}
