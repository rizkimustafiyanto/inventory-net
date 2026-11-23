using Inventory.Application.Events;
using Inventory.Application.Interfaces;
using Inventory.Domain.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inventory.Api.BackgroundServices;

public class AvatarProcessingBackgroundService : BackgroundService
{
    private readonly IUploadEventQueue _eventQueue;
    private readonly IFileStorageService _fileStorageService;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AvatarProcessingBackgroundService> _logger;

    public AvatarProcessingBackgroundService(
        IUploadEventQueue eventQueue,
        IFileStorageService fileStorageService,
        IServiceProvider serviceProvider,
        ILogger<AvatarProcessingBackgroundService> logger)
    {
        _eventQueue = eventQueue;
        _fileStorageService = fileStorageService;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AvatarProcessingBackgroundService started listening to upload event queue.");

        try
        {
            await foreach (var @event in _eventQueue.ReadEventsAsync(stoppingToken))
            {
                await ProcessAvatarUploadAsync(@event, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("AvatarProcessingBackgroundService is stopping due to cancellation.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error in AvatarProcessingBackgroundService event loop.");
        }
    }

    private async Task ProcessAvatarUploadAsync(UserAvatarUploadedEvent @event, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Processing avatar upload event for User #{UserId}...", @event.UserId);

            using var scope = _serviceProvider.CreateScope();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var notificationService = scope.ServiceProvider.GetRequiredService<IInventoryNotificationService>();
            var redis = scope.ServiceProvider.GetService<IConnectionMultiplexer>();

            var user = await unitOfWork.Users.GetByIdAsync(@event.UserId, cancellationToken);
            if (user == null)
            {
                _logger.LogWarning("User #{UserId} not found. Deleting orphaned temp file: {Temp}", @event.UserId, @event.TempFilePath);
                File.Delete(@event.TempFilePath);
                return;
            }

            var oldAvatarUrl = user.AvatarUrl;

            // 1. Move temp WebP to permanent avatars storage
            var targetFileName = $"avatar_{user.Id}_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N[..8]}.webp";
            var newAvatarUrl = await _fileStorageService.MoveTempToPermanentAsync(
                @event.TempFilePath,
                "avatars",
                targetFileName,
                cancellationToken);

            // 2. Delete old avatar file from disk to prevent storage accumulation
            if (!string.IsNullOrWhiteSpace(oldAvatarUrl) && !oldAvatarUrl.Equals(newAvatarUrl, StringComparison.OrdinalIgnoreCase))
            {
                await _fileStorageService.DeleteFileAsync(oldAvatarUrl, cancellationToken);
                _logger.LogInformation("Cleaned up old avatar for User #{UserId}: {Old}", user.Id, oldAvatarUrl);
            }

            // 3. Update User record in database
            user.AvatarUrl = newAvatarUrl;
            user.UpdatedAt = DateTime.UtcNow;
            unitOfWork.Users.Update(user);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            // 4. Invalidate Redis user cache if present
            if (redis != null && redis.IsConnected)
            {
                try
                {
                    var db = redis.GetDatabase();
                    await db.KeyDeleteAsync($"cache:user:{user.Id}");
                    await db.KeyDeleteAsync($"cache:profile:{user.Id}");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to invalidate Redis user cache for User #{UserId}", user.Id);
                }
            }

            // 5. Broadcast real-time SignalR event to all client sessions
            await notificationService.BroadcastUserAvatarUpdatedAsync(user.Id, newAvatarUrl, cancellationToken);

            _logger.LogInformation(
                "Successfully processed and published avatar update for User #{UserId} -> {Url} ({Bytes} bytes)",
                user.Id,
                newAvatarUrl,
                @event.FileSizeBytes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process avatar upload for User #{UserId}", @event.UserId);
        }
    }
}
