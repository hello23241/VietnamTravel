using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelGuide.Api.Data;
using TravelGuide.Api.DTOs;

namespace TravelGuide.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProvincesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProvincesController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách tất cả các tỉnh/thành phố, có thể lọc theo miền (Bắc, Trung, Nam).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProvinceResponseDto>>> GetProvinces([FromQuery] string? region)
    {
        var query = _context.Provinces.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(region))
        {
            var regionLower = region.Trim().ToLower();
            query = query.Where(p => p.Region.ToLower() == regionLower);
        }

        var results = await query
            .OrderBy(p => p.Id)
            .Select(p => new ProvinceResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Region = p.Region,
                BannerUrl = p.BannerUrl,
                TotalPlaces = p.Places.Count
            })
            .ToListAsync();

        return Ok(results);
    }

    /// <summary>
    /// Lấy chi tiết thông tin của một tỉnh/thành phố theo Id.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ProvinceResponseDto>> GetProvinceById(int id)
    {
        var province = await _context.Provinces
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new ProvinceResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Region = p.Region,
                BannerUrl = p.BannerUrl,
                TotalPlaces = p.Places.Count
            })
            .FirstOrDefaultAsync();

        if (province == null)
        {
            return NotFound(new { message = $"Không tìm thấy tỉnh/thành phố với mã {id}" });
        }

        return Ok(province);
    }
}