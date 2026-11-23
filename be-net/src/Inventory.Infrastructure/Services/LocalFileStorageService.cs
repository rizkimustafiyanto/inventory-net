using Inventory.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Inventory.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _uploadRootPath;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(IConfiguration configuration, ILogger<LocalFileStorageService> logger)
    {
        _logger = logger;
        var configPath = configuration["Storage:UploadPath"];
        _uploadRootPath = !string.IsNullOrWhiteSpace(configPath)
            ? Path.GetFullPath(configPath)
            : Path.Combine(Directory.GetCurrentDirectory(), "uploads");

        // Ensure directories exist
        Directory.CreateDirectory(_uploadRootPath);
        Directory.CreateDirectory(Path.Combine(_uploadRootPath, "temp"));
        Directory.CreateDirectory(Path.Combine(_uploadRootPath, "avatars"));
    }

    public async Task<string> SaveTempFileAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var tempDir = Path.Combine(_uploadRootPath, "temp");
        Directory.CreateDirectory(tempDir);

        var tempFileName = $"temp_{Guid.NewGuid():N}.webp";
        var tempFilePath = Path.Combine(tempDir, tempFileName);

        using (var destinationStream = new FileStream(tempFilePath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, useAsync: true))
        {
            await fileStream.CopyToAsync(destinationStream, cancellationToken);
        }

        _logger.LogInformation("Stored temporary upload file at: {Path}", tempFilePath);
        return tempFilePath;
    }

    public Task<string> MoveTempToPermanentAsync(string tempFilePath, string subFolder, string targetFileName, CancellationToken cancellationToken = default)
    {
        var targetDir = Path.Combine(_uploadRootPath, subFolder);
        Directory.CreateDirectory(targetDir);

        var targetFilePath = Path.Combine(targetDir, targetFileName);

        if (File.Exists(tempFilePath))
        {
            File.Move(tempFilePath, targetFilePath, overwrite: true);
            _logger.LogInformation("Moved file from {Temp} to {Target}", tempFilePath, targetFilePath);
        }
        else
        {
            _logger.LogWarning("Temp file {Temp} not found during move operation", tempFilePath);
        }

        // Return public URL path with forward slashes (e.g. /uploads/avatars/avatar_1.webp)
        var relativeUrl = $"/uploads/{subFolder.Replace('\\', '/')}/{targetFileName}";
        return Task.FromResult(relativeUrl);
    }

    public Task<bool> DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return Task.FromResult(false);

        try
        {
            var cleanRelative = relativePath.TrimStart('/').Replace("uploads/", "");
            var fullPath = Path.Combine(_uploadRootPath, cleanRelative);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                _logger.LogInformation("Deleted file: {Path}", fullPath);
                return Task.FromResult(true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file: {Path}", relativePath);
        }

        return Task.FromResult(false);
    }

    public bool ValidateWebPMagicBytes(byte[] headerBytes)
    {
        // WebP format specification:
        // Bytes 0..3: ASCII 'RIFF' (0x52, 0x49, 0x46, 0x46)
        // Bytes 8..11: ASCII 'WEBP' (0x57, 0x45, 0x42, 0x50)
        if (headerBytes == null || headerBytes.Length < 12)
            return false;

        bool isRiff = headerBytes[0] == 0x52 && headerBytes[1] == 0x49 && headerBytes[2] == 0x46 && headerBytes[3] == 0x46;
        bool isWebp = headerBytes[8] == 0x57 && headerBytes[9] == 0x45 && headerBytes[10] == 0x42 && headerBytes[11] == 0x50;

        return isRiff && isWebp;
    }
}
