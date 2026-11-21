using Inventory.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("stock-summary")]
    public async Task<IActionResult> GetStockSummary(
        [FromQuery] DateTime? date,
        [FromQuery] string? search = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool all = false,
        CancellationToken cancellationToken = default)
    {
        if (all)
        {
            var allResult = await _reportService.GetStockSummaryReportsAsync(date, cancellationToken);
            return Ok(allResult);
        }

        var result = await _reportService.GetPagedStockSummaryReportsAsync(date, search, pageNumber, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("stock-summary/all")]
    public async Task<IActionResult> GetStockSummaryAll([FromQuery] DateTime? date, CancellationToken cancellationToken)
    {
        var result = await _reportService.GetStockSummaryReportsAsync(date, cancellationToken);
        return Ok(result);
    }
}
