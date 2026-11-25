namespace Inventory.Infrastructure.Data;

/// <summary>
/// Fatal startup exception thrown when database migration history conflicts with application migrations
/// or when an invalid migration policy configuration is supplied.
/// Must fail fast without transient database startup retries.
/// </summary>
public sealed class MigrationGuardException : Exception
{
    public MigrationGuardException(string message) : base(message)
    {
    }

    public MigrationGuardException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
