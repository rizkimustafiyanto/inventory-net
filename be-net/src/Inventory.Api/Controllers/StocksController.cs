using System.Security.Claims;
using Inventory.Application.DTOs.Stock;
using Inventory.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StocksController : ControllerBase
{
    private readonly IStockService _stockService;

    public StocksController(IStockService stockService)
    {
        _stockService = stockService;
    }

    [HttpPost("movement")]
    [Authorize]
    public async Task<IActionResult> RecordMovement([FromBody] CreateStockMovementDto dto, CancellationToken cancellationToken)
    {
        long? userId = null;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (long.TryParse(userIdClaim, out var parsedId))
        {
            userId = parsedId;
        }

        var result = await _stockService.RecordMovementAsync(dto, userId, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("movements")]
    public async Task<IActionResult> GetMovements(
        [FromQuery] long? productId = null,
        [FromQuery] int? type = null,
        [FromQuery] string? search = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 15,
        CancellationToken cancellationToken = default)
    {
        var result = await _stockService.GetMovementsAsync(productId, type, search, pageNumber, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var result = await _stockService.GetStockSummaryAsync(cancellationToken);
        return Ok(result);
    }
}
