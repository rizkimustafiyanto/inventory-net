# Development stage (used for docker compose watch / live reload)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dev
WORKDIR /app

# Copy solution and csproj files for layer caching
COPY Inventory.sln .
COPY src/Inventory.Domain/Inventory.Domain.csproj src/Inventory.Domain/
COPY src/Inventory.Application/Inventory.Application.csproj src/Inventory.Application/
COPY src/Inventory.Infrastructure/Inventory.Infrastructure.csproj src/Inventory.Infrastructure/
COPY src/Inventory.Api/Inventory.Api.csproj src/Inventory.Api/
COPY tests/Inventory.Application.UnitTests/Inventory.Application.UnitTests.csproj tests/Inventory.Application.UnitTests/

# Restore dependencies
RUN dotnet restore

# Copy full source
COPY . .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Development
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
ENV DOTNET_WATCH_RESTART_ON_RUDE_EDIT=1

CMD ["dotnet", "watch", "run", "--project", "src/Inventory.Api/Inventory.Api.csproj", "--non-interactive", "--no-launch-profile"]

# Publish stage (for production)
FROM dev AS build
RUN dotnet publish src/Inventory.Api/Inventory.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage (Production)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Inventory.Api.dll"]
