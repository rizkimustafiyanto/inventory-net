using System.Linq.Expressions;
using FluentAssertions;
using Inventory.Application.DTOs.User;
using Inventory.Application.Interfaces;
using Inventory.Application.Services;
using Inventory.Domain.Entities;
using Inventory.Domain.Enums;
using Inventory.Domain.Interfaces;
using Moq;
using Xunit;

namespace Inventory.Application.UnitTests;

public class UserServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IRepository<User>> _userRepoMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly UserService _sut;

    public UserServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _userRepoMock = new Mock<IRepository<User>>();
        _passwordHasherMock = new Mock<IPasswordHasher>();

        _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepoMock.Object);
        _sut = new UserService(_unitOfWorkMock.Object, _passwordHasherMock.Object);
    }

    [Fact]
    public async Task CreateUserAsync_WhenValid_ShouldCreateUser()
    {
        // Arrange
        _userRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<User>());

        _passwordHasherMock.Setup(p => p.HashPassword("staff123"))
            .Returns("hashed_staff123");

        var dto = new CreateUserDto
        {
            Username = "staff2",
            Email = "staff2@inventory.local",
            Password = "staff123",
            FullName = "Staff Dua",
            Role = UserRole.Staff
        };

        // Act
        var result = await _sut.CreateUserAsync(dto);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Username.Should().Be("staff2");
        result.Data.Role.Should().Be(UserRole.Staff);

        _userRepoMock.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteUserAsync_WhenPrimaryAdmin_ShouldPreventDeletion()
    {
        // Arrange
        var admin = new User { Id = 1, Username = "admin" };
        _userRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(admin);

        // Act
        var result = await _sut.DeleteUserAsync(1);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("cannot be deleted");
        _userRepoMock.Verify(r => r.Delete(It.IsAny<User>()), Times.Never);
    }
}
