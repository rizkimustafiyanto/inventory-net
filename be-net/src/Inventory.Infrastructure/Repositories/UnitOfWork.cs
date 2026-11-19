using Inventory.Domain.Entities;
using Inventory.Domain.Interfaces;
using Inventory.Infrastructure.Data;

namespace Inventory.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IRepository<Product>? _products;
    private IRepository<Category>? _categories;
    private IRepository<StockMovement>? _stockMovements;
    private IRepository<User>? _users;
    private IRepository<StockReport>? _stockReports;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IRepository<Product> Products => _products ??= new GenericRepository<Product>(_context);
    public IRepository<Category> Categories => _categories ??= new GenericRepository<Category>(_context);
    public IRepository<StockMovement> StockMovements => _stockMovements ??= new GenericRepository<StockMovement>(_context);
    public IRepository<User> Users => _users ??= new GenericRepository<User>(_context);
    public IRepository<StockReport> StockReports => _stockReports ??= new GenericRepository<StockReport>(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
