using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelGuide.Api.Data;
using TravelGuide.Api.DTOs;

namespace TravelGuide.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ danh mục trải nghiệm.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryResponseDto>>> GetCategories()
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .Select(c => new CategoryResponseDto
            {
                Id = c.Id,
                Name = c.Name,
                IconUrl = c.IconUrl
            })
            .ToListAsync();

        return Ok(categories);
    }
}