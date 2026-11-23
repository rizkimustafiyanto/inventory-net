namespace Inventory.Application.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveTempFileAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);
    Task<string> MoveTempToPermanentAsync(string tempFilePath, string subFolder, string targetFileName, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default);
    bool ValidateWebPMagicBytes(byte[] headerBytes);
}
