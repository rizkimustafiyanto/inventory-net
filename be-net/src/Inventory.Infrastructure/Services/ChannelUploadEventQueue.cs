using System.Threading.Channels;
using Inventory.Application.Events;
using Inventory.Application.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Inventory.Infrastructure.Services;

public class ChannelUploadEventQueue : IUploadEventQueue
{
    private readonly Channel<UserAvatarUploadedEvent> _channel;
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<ChannelUploadEventQueue> _logger;
    private const string RedisAvatarChannel = "inventory:events:avatar_uploaded";

    public ChannelUploadEventQueue(ILogger<ChannelUploadEventQueue> logger, IConnectionMultiplexer? redis = null)
    {
        _logger = logger;
        _redis = redis;
        var options = new UnboundedChannelOptions
        {
            SingleReader = false,
            SingleWriter = false
        };
        _channel = Channel.CreateUnbounded<UserAvatarUploadedEvent>(options);
    }

    public async ValueTask PublishAvatarUploadEventAsync(UserAvatarUploadedEvent @event, CancellationToken cancellationToken = default)
    {
        await _channel.Writer.WriteAsync(@event, cancellationToken);
        _logger.LogInformation("Queued UserAvatarUploadedEvent for User #{UserId} in background channel", @event.UserId);

        // Optional Redis Pub/Sub broadcast for multi-instance distributed worker scaling
        if (_redis != null && _redis.IsConnected)
        {
            try
            {
                var sub = _redis.GetSubscriber();
                var json = System.Text.Json.JsonSerializer.Serialize(@event);
                await sub.PublishAsync(RedisChannel.Literal(RedisAvatarChannel), json);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to publish UserAvatarUploadedEvent to Redis channel");
            }
        }
    }

    public IAsyncEnumerable<UserAvatarUploadedEvent> ReadEventsAsync(CancellationToken cancellationToken = default)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
