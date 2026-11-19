using Inventory.Domain.Entities;

namespace Inventory.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<Product> Products { get; }
    IRepository<Category> Categories { get; }
    IRepository<StockMovement> StockMovements { get; }
    IRepository<User> Users { get; }
    IRepository<StockReport> StockReports { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
