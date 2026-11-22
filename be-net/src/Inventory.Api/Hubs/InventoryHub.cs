using Microsoft.AspNetCore.SignalR;

namespace Inventory.Api.Hubs;

public class InventoryHub : Hub
{
    public const string HubUrl = "/hubs/inventory";

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
