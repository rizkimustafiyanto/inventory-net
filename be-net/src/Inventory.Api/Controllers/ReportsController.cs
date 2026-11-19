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
    public async Task<IActionResult> GetStockSummary([FromQuery] DateTime? date, CancellationToken cancellationToken)
    {
        var result = await _reportService.GetStockSummaryReportsAsync(date, cancellationToken);
        return Ok(result);
    }
}
