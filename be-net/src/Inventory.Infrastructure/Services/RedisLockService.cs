using System.Collections.Concurrent;
using System.Diagnostics;
using Inventory.Application.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inventory.Infrastructure.Services;

public class RedisLockService : IDistributedLockService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<RedisLockService> _logger;

    // Fallback in-memory semaphore dictionary for local development if Redis is unavailable
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _inMemorySemaphores = new();

    public RedisLockService(
        ILogger<RedisLockService> _logger,
        IConnectionMultiplexer? redis = null)
    {
        this._logger = _logger;
        _redis = redis;
    }

    public async Task<IDisposable?> AcquireLockAsync(
        string resourceKey,
        TimeSpan timeout,
        TimeSpan expiry,
        CancellationToken cancellationToken = default)
    {
        var lockKey = $"lock:{resourceKey}";
        var lockValue = Guid.NewGuid().ToString("N");

        // 1. Try Redis Distributed Lock if connected
        if (_redis != null && _redis.IsConnected)
        {
            try
            {
                var db = _redis.GetDatabase();
                var stopwatch = Stopwatch.StartNew();

                while (stopwatch.Elapsed < timeout)
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    bool acquired = await db.LockTakeAsync(lockKey, lockValue, expiry);
                    if (acquired)
                    {
                        return new RedisLockReleaser(db, lockKey, lockValue, _logger);
                    }

                    // Wait 40-60ms with slight jitter before retrying
                    await Task.Delay(50, cancellationToken);
                }

                _logger.LogWarning("Timed out acquiring Redis distributed lock for key: {Key}", lockKey);
                return null;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Redis error during lock acquisition for {Key}. Falling back to in-memory semaphore.", lockKey);
            }
        }

        // 2. Fallback: In-memory concurrency semaphore (ensures thread-safety on single instance)
        var semaphore = _inMemorySemaphores.GetOrAdd(resourceKey, _ => new SemaphoreSlim(1, 1));
        bool semAcquired = await semaphore.WaitAsync(timeout, cancellationToken);
        if (!semAcquired)
        {
            _logger.LogWarning("Timed out acquiring in-memory fallback lock for {Key}", resourceKey);
            return null;
        }

        return new InMemoryLockReleaser(semaphore);
    }

    private sealed class RedisLockReleaser : IDisposable
    {
        private readonly IDatabase _db;
        private readonly string _key;
        private readonly string _value;
        private readonly ILogger _logger;
        private bool _disposed;

        public RedisLockReleaser(IDatabase db, string key, string value, ILogger logger)
        {
            _db = db;
            _key = key;
            _value = value;
            _logger = logger;
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;

            try
            {
                _db.LockRelease(_key, _value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to release Redis distributed lock for {Key}", _key);
            }
        }
    }

    private sealed class InMemoryLockReleaser : IDisposable
    {
        private readonly SemaphoreSlim _semaphore;
        private bool _disposed;

        public InMemoryLockReleaser(SemaphoreSlim semaphore)
        {
            _semaphore = semaphore;
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _semaphore.Release();
        }
    }
}
