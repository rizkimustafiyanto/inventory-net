using System.Linq.Expressions;
using FluentAssertions;
using Inventory.Application.DTOs.Product;
using Inventory.Application.Services;
using Inventory.Domain.Entities;
using Inventory.Domain.Interfaces;
using Moq;
using Xunit;

namespace Inventory.Application.UnitTests;

public class ProductServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IRepository<Product>> _productRepoMock;
    private readonly Mock<IRepository<Category>> _categoryRepoMock;
    private readonly Mock<IRepository<StockMovement>> _stockMovementRepoMock;
    private readonly ProductService _sut;

    public ProductServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _productRepoMock = new Mock<IRepository<Product>>();
        _categoryRepoMock = new Mock<IRepository<Category>>();
        _stockMovementRepoMock = new Mock<IRepository<StockMovement>>();

        _unitOfWorkMock.Setup(u => u.Products).Returns(_productRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.Categories).Returns(_categoryRepoMock.Object);
        _unitOfWorkMock.Setup(u => u.StockMovements).Returns(_stockMovementRepoMock.Object);

        _sut = new ProductService(_unitOfWorkMock.Object);
    }

    [Fact]
    public async Task CreateProductAsync_WhenValid_ShouldCreateProductSuccessfully()
    {
        // Arrange
        _productRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Product, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Product>());

        var dto = new CreateProductDto
        {
            Sku = "ELEC-01",
            Name = "Monitor LG 24 Inch",
            Price = 1850000,
            InitialStock = 5,
            MinStockLevel = 2,
            CategoryId = 1
        };

        // Act
        var result = await _sut.CreateProductAsync(dto);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Sku.Should().Be("ELEC-01");
        result.Data.StockQuantity.Should().Be(5);

        _productRepoMock.Verify(r => r.AddAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()), Times.Once);
        _stockMovementRepoMock.Verify(r => r.AddAsync(It.IsAny<StockMovement>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateProductAsync_WhenSkuAlreadyExists_ShouldReturnFail()
    {
        // Arrange
        var existingProducts = new List<Product>
        {
            new() { Id = 1, Sku = "ELEC-01", Name = "Existing Monitor" }
        };

        _productRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Product, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingProducts);

        var dto = new CreateProductDto
        {
            Sku = "ELEC-01",
            Name = "Duplicate Monitor",
            Price = 2000000
        };

        // Act
        var result = await _sut.CreateProductAsync(dto);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("already exists");
        _productRepoMock.Verify(r => r.AddAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetPagedProductsAsync_WhenPageSizeExceedsMax_ShouldClampTo100()
    {
        // Arrange
        _productRepoMock.Setup(r => r.GetPagedAsync(
            It.IsAny<Expression<Func<Product, bool>>>(),
            1,
            100,
            It.IsAny<Func<IQueryable<Product>, IOrderedQueryable<Product>>>(),
            It.IsAny<CancellationToken>(),
            It.IsAny<Expression<Func<Product, object>>[]>()))
            .ReturnsAsync((new List<Product>(), 0));

        // Act (requesting pageNumber -5 and pageSize 500)
        var result = await _sut.GetPagedProductsAsync(pageNumber: -5, pageSize: 500);

        // Assert
        result.Success.Should().BeTrue();
        result.Meta.Should().NotBeNull();
        result.Meta!.PageNumber.Should().Be(1);
        result.Meta.PageSize.Should().Be(100);
    }
}
