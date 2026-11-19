FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
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

# Copy full source and build
COPY . .
RUN dotnet publish src/Inventory.Api/Inventory.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Development

ENTRYPOINT ["dotnet", "Inventory.Api.dll"]
