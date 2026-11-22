using System.Linq.Expressions;
using FluentAssertions;
using Inventory.Application.DTOs.Stock;
using Inventory.Application.Interfaces;
using Inventory.Application.Services;
using Inventory.Domain.Entities;
using Inventory.Domain.Enums;
using Inventory.Domain.Interfaces;
using Moq;
using Xunit;

namespace Inventory.Application.UnitTests;

public class StockServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IRepository<Product>> _productRepoMock;
    private readonly Mock<IRepository<StockMovement>> _stockMovementRepoMock;
    private readonly Mock<IRepository<User>> _userRepoMock;
    private readonly Mock<IDistributedLockService> _lockServiceMock;
    private readonly Mock<IInventoryNotificationService> _notificationServiceMock;
    private readonly StockService _sut; // System Under Test

    public StockServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _productRepoMock = new Mock<IRepository<Product>>();
        _stockMovementRepoMock = new Mock<IRepository<StockMovement>>();
        _userRepoMock = new Mock<IRepository<User>>();
        _lockServiceMock = new Mock<IDistributedLockService>();
        _notificationServiceMock = new Mock<IInventoryNotificationService>();

        _unitOfWorkMock.Setup(u => u.Products).Returns(_productRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.StockMovements).Returns(_stockMovementRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepoMock.Object);

        var disposableMock = new Mock<IDisposable>();
        _lockServiceMock.Setup(l => l.AcquireLockAsync(
            It.IsAny<string>(),
            It.IsAny<TimeSpan>(),
            It.IsAny<TimeSpan>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(disposableMock.Object);

        _sut = new StockService(_unitOfWorkMock.Object, _lockServiceMock.Object, _notificationServiceMock.Object);
    }

    [Fact]
    public async Task RecordMovementAsync_StockIn_ShouldIncreaseProductStock()
    {
        // Arrange
        var product = new Product
        {
            Id = 1,
            Sku = "TEST-01",
            Name = "Test Product",
            StockQuantity = 10
        };

        _productRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        var dto = new CreateStockMovementDto
        {
            ProductId = 1,
            Type = StockMovementType.In,
            Quantity = 15,
            Reason = "Supplier Restock"
        };

        // Act
        var result = await _sut.RecordMovementAsync(dto);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.StockBefore.Should().Be(10);
        result.Data.StockAfter.Should().Be(25);
        product.StockQuantity.Should().Be(25);

        _productRepoMock.Verify(r => r.Update(product), Times.Once);
        _stockMovementRepoMock.Verify(r => r.AddAsync(It.IsAny<StockMovement>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RecordMovementAsync_StockOut_WhenStockIsSufficient_ShouldDecreaseProductStock()
    {
        // Arrange
        var product = new Product
        {
            Id = 1,
            Sku = "TEST-01",
            Name = "Test Product",
            StockQuantity = 20
        };

        _productRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        var dto = new CreateStockMovementDto
        {
            ProductId = 1,
            Type = StockMovementType.Out,
            Quantity = 7,
            Reason = "Customer Order"
        };

        // Act
        var result = await _sut.RecordMovementAsync(dto);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.StockBefore.Should().Be(20);
        result.Data.StockAfter.Should().Be(13);
        product.StockQuantity.Should().Be(13);

        _productRepoMock.Verify(r => r.Update(product), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RecordMovementAsync_StockOut_WhenStockIsInsufficient_ShouldFailAndNotUpdate()
    {
        // Arrange
        var product = new Product
        {
            Id = 1,
            Sku = "TEST-01",
            Name = "Test Product",
            StockQuantity = 5
        };

        _productRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        var dto = new CreateStockMovementDto
        {
            ProductId = 1,
            Type = StockMovementType.Out,
            Quantity = 10,
            Reason = "Over requested"
        };

        // Act
        var result = await _sut.RecordMovementAsync(dto);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Insufficient stock");
        product.StockQuantity.Should().Be(5); // Stock unchanged

        _productRepoMock.Verify(r => r.Update(It.IsAny<Product>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecordMovementAsync_Adjustment_ShouldSetExactStockQuantity()
    {
        // Arrange
        var product = new Product
        {
            Id = 1,
            Sku = "TEST-01",
            Name = "Test Product",
            StockQuantity = 30
        };

        _productRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        var dto = new CreateStockMovementDto
        {
            ProductId = 1,
            Type = StockMovementType.Adjustment,
            Quantity = 22, // Physical count is 22
            Reason = "Stock Opname Verification"
        };

        // Act
        var result = await _sut.RecordMovementAsync(dto);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.StockBefore.Should().Be(30);
        result.Data.StockAfter.Should().Be(22);
        product.StockQuantity.Should().Be(22);

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RecordMovementAsync_WhenProductNotFound_ShouldReturnFail()
    {
        // Arrange
        _productRepoMock.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        var dto = new CreateStockMovementDto
        {
            ProductId = 999,
            Type = StockMovementType.In,
            Quantity = 10
        };

        // Act
        var result = await _sut.RecordMovementAsync(dto);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Product not found");
    }

    [Fact]
    public async Task GetStockSummaryAsync_ShouldCalculateCorrectMetrics()
    {
        // Arrange
        _productRepoMock.Setup(r => r.CountAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(3);
        _productRepoMock.Setup(r => r.SumAsync(It.IsAny<Expression<Func<Product, int>>>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(23);
        _productRepoMock.Setup(r => r.CountAsync(It.Is<Expression<Func<Product, bool>>>(exp => exp != null && exp.ToString().Contains("MinStockLevel")), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        _productRepoMock.Setup(r => r.CountAsync(It.Is<Expression<Func<Product, bool>>>(exp => exp != null && exp.ToString().Contains("0")), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _sut.GetStockSummaryAsync();

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.TotalProducts.Should().Be(3);
        result.Data.TotalItemsInStock.Should().Be(23);
        result.Data.LowStockCount.Should().Be(1);
        result.Data.OutOfStockCount.Should().Be(1);
    }

    [Fact]
    public async Task GetMovementsAsync_WhenPageSizeExceedsMax_ShouldClampTo100()
    {
        // Arrange
        _stockMovementRepoMock.Setup(r => r.GetPagedAsync(
            It.IsAny<Expression<Func<StockMovement, bool>>>(),
            1,
            100,
            It.IsAny<Func<IQueryable<StockMovement>, IOrderedQueryable<StockMovement>>>(),
            It.IsAny<CancellationToken>(),
            It.IsAny<Expression<Func<StockMovement, object>>[]>()))
            .ReturnsAsync((new List<StockMovement>(), 0));

        // Act (requesting pageNumber 0 and pageSize 999)
        var result = await _sut.GetMovementsAsync(pageNumber: 0, pageSize: 999);

        // Assert
        result.Success.Should().BeTrue();
        result.Meta.Should().NotBeNull();
        result.Meta!.PageNumber.Should().Be(1);
        result.Meta.PageSize.Should().Be(100);
    }
}
