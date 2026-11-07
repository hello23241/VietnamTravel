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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProvinceResponseDto>>> GetProvinces([FromQuery] string? region)
    {
        var results = await _context.Provinces
            .AsNoTracking()
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

        if (!string.IsNullOrWhiteSpace(region) && !region.Trim().Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var reg = region.Trim();
            results = results
                .Where(p => p.Region.Equals(reg, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        return Ok(results);
    }

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