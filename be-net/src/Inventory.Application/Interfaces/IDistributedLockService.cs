namespace Inventory.Application.Interfaces;

public interface IDistributedLockService
{
    Task<IDisposable?> AcquireLockAsync(
        string resourceKey,
        TimeSpan timeout,
        TimeSpan expiry,
        CancellationToken cancellationToken = default);
}
