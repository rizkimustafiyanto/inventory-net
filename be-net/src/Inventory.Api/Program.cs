using System.Text;
using Inventory.Api.BackgroundServices;
using Inventory.Api.Hubs;
using Inventory.Api.Middlewares;
using Inventory.Api.Services;
using Inventory.Application.Interfaces;
using Inventory.Infrastructure;
using Inventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Infrastructure Services (DbContext, Repositories, Services, Security, Redis, Storage)
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Add SignalR & Inventory Notification Service
builder.Services.AddSignalR();
builder.Services.AddScoped<IInventoryNotificationService, InventoryNotificationService>();

// 3. Add Event-Driven Avatar Processing Background Worker
builder.Services.AddHostedService<AvatarProcessingBackgroundService>();

// 3. Add JWT Authentication (with SignalR query token extraction)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "INVENTORY_NET_ULTRA_SECURE_JWT_SECRET_KEY_2026_TEST_KEY_MUST_BE_LONG!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "InventoryNetApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "InventoryNetClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("StaffOrAdmin", policy => policy.RequireRole("Admin", "Staff"));
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole("Admin", "Manager"));
    options.AddPolicy("AllStaff", policy => policy.RequireRole("Admin", "Staff", "Manager"));
});

// 4. Add CORS for Frontend (Supporting credentials for SignalR WebSockets)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 4. Add Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 5. Add Swagger with JWT Support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Inventory Management API (.NET 8 Clean Architecture)",
        Version = "v1",
        Description = "API for Inventory & Stock Management with Oracle Database"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 6. Global Exception Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

// 7. Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Inventory API v1");
    c.RoutePrefix = "swagger";
});

// 8. CORS, Static Files, Auth & Controllers
app.UseCors("AllowAll");

// Serve uploaded assets with caching
var uploadDirectory = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
Directory.CreateDirectory(uploadDirectory);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadDirectory),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=604800");
    }
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<InventoryHub>("/hubs/inventory");

// Health Check Endpoint
app.MapGet("/", () => Results.Ok(new
{
    status = "healthy",
    service = "Inventory Management .NET Core API",
    architecture = "Clean Architecture (Domain, Application, Infrastructure, Api)",
    database = "Oracle Database (EF Core)"
}));

// 9. Database Auto-Migration & Seed on Startup with Retry
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<ApplicationDbContext>();
    var hasher = services.GetRequiredService<IPasswordHasher>();
    var orphanedMigrationPolicy = builder.Configuration["DatabaseMigration:OrphanedMigrationPolicy"] ?? "strict";

    const int maxRetries = 12;
    const int delaySeconds = 6;
    bool initialized = false;
    Exception? lastException = null;

    for (int attempt = 1; attempt <= maxRetries; attempt++)
    {
        try
        {
            logger.LogInformation(
                "Attempting to connect and initialize database (Attempt {Attempt}/{MaxRetries}, Policy: {Policy})...",
                attempt,
                maxRetries,
                orphanedMigrationPolicy);

            await DbInitializer.InitializeAsync(context, hasher, logger, orphanedMigrationPolicy);
            logger.LogInformation("Database initialized and seeded successfully.");
            initialized = true;
            break;
        }
        catch (MigrationGuardException ex)
        {
            logger.LogCritical(ex, "Fatal migration guard failure during startup. Aborting immediately.");
            throw;
        }
        catch (Exception ex)
        {
            lastException = ex;
            logger.LogWarning("Database connection not ready yet ({Attempt}/{MaxRetries}): {Message}. Retrying in {Delay}s...", attempt, maxRetries, ex.Message, delaySeconds);
            if (attempt < maxRetries)
            {
                await Task.Delay(TimeSpan.FromSeconds(delaySeconds));
            }
        }
    }

    if (!initialized)
    {
        logger.LogCritical(lastException, "Failed to initialize database after {MaxRetries} attempts.", maxRetries);
        throw new InvalidOperationException($"Failed to initialize database after {maxRetries} attempts.", lastException);
    }
}

app.Run();
