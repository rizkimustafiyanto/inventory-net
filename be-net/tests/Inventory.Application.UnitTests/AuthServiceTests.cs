using System.Linq.Expressions;
using FluentAssertions;
using Inventory.Application.DTOs.Auth;
using Inventory.Application.Interfaces;
using Inventory.Application.Services;
using Inventory.Domain.Entities;
using Inventory.Domain.Enums;
using Inventory.Domain.Interfaces;
using Moq;
using Xunit;

namespace Inventory.Application.UnitTests;

public class AuthServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IRepository<User>> _userRepoMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IJwtTokenGenerator> _jwtTokenGeneratorMock;
    private readonly Mock<IFileStorageService> _fileStorageServiceMock;
    private readonly Mock<IUploadEventQueue> _uploadEventQueueMock;
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _userRepoMock = new Mock<IRepository<User>>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _jwtTokenGeneratorMock = new Mock<IJwtTokenGenerator>();
        _fileStorageServiceMock = new Mock<IFileStorageService>();
        _uploadEventQueueMock = new Mock<IUploadEventQueue>();

        _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepoMock.Object);

        _sut = new AuthService(
            _unitOfWorkMock.Object,
            _passwordHasherMock.Object,
            _jwtTokenGeneratorMock.Object,
            _fileStorageServiceMock.Object,
            _uploadEventQueueMock.Object);
    }

    [Fact]
    public async Task LoginAsync_WhenCredentialsValid_ShouldReturnToken()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Username = "admin",
            PasswordHash = "hashed_pw",
            FullName = "Admin User",
            Role = UserRole.Admin,
            IsActive = true
        };

        _userRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<User> { user });

        _passwordHasherMock.Setup(h => h.VerifyPassword("admin123", "hashed_pw"))
            .Returns(true);

        var expiresAt = DateTime.UtcNow.AddHours(24);
        _jwtTokenGeneratorMock.Setup(j => j.GenerateToken(user))
            .Returns(("valid_jwt_token", expiresAt));

        var request = new LoginRequestDto
        {
            Username = "admin",
            Password = "admin123"
        };

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Token.Should().Be("valid_jwt_token");
        result.Data.Username.Should().Be("admin");
        result.Data.Role.Should().Be("Admin");
    }

    [Fact]
    public async Task LoginAsync_WhenPasswordInvalid_ShouldReturnFail()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Username = "admin",
            PasswordHash = "hashed_pw",
            IsActive = true
        };

        _userRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<User> { user });

        _passwordHasherMock.Setup(h => h.VerifyPassword("wrong_password", "hashed_pw"))
            .Returns(false);

        var request = new LoginRequestDto
        {
            Username = "admin",
            Password = "wrong_password"
        };

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Invalid username or password");
    }
}
