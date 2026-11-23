namespace Inventory.Application.Events;

public class UserAvatarUploadedEvent
{
    public long UserId { get; set; }
    public string TempFilePath { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
