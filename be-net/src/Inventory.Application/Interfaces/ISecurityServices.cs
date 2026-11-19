using Inventory.Domain.Entities;

namespace Inventory.Application.Interfaces;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAt) GenerateToken(User user);
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}
