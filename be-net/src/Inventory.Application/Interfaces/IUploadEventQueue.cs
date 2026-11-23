using Inventory.Application.Events;

namespace Inventory.Application.Interfaces;

public interface IUploadEventQueue
{
    ValueTask PublishAvatarUploadEventAsync(UserAvatarUploadedEvent @event, CancellationToken cancellationToken = default);
    IAsyncEnumerable<UserAvatarUploadedEvent> ReadEventsAsync(CancellationToken cancellationToken = default);
}
