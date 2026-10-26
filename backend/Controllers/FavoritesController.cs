using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelGuide.Api.Data;
using TravelGuide.Api.DTOs;
using TravelGuide.Api.Models;

namespace TravelGuide.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FavoritesController : ControllerBase
{
    private readonly AppDbContext _context;

    public FavoritesController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Bật hoặc tắt trạng thái lưu yêu thích một địa điểm (Toggle Favorite).
    /// </summary>
    [HttpPost("toggle")]
    public async Task<IActionResult> ToggleFavorite([FromBody] FavoriteToggleDto dto)
    {
        var userExists = await _context.Users.AnyAsync(u => u.Id == dto.UserId);
        if (!userExists)
            return BadRequest(new { message = $"Người dùng với mã {dto.UserId} không tồn tại" });

        var placeExists = await _context.Places.AnyAsync(p => p.Id == dto.PlaceId);
        if (!placeExists)
            return BadRequest(new { message = $"Địa điểm với mã {dto.PlaceId} không tồn tại" });

        var favorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == dto.UserId && f.PlaceId == dto.PlaceId);

        if (favorite != null)
        {
            // Nếu đã thích -> Bỏ thích
            _context.Favorites.Remove(favorite);
            await _context.SaveChangesAsync();
            return Ok(new { isFavorite = false, message = "Đã bỏ lưu địa điểm khỏi sổ tay yêu thích" });
        }
        else
        {
            // Chưa thích -> Thêm vào yêu thích
            _context.Favorites.Add(new Favorite
            {
                UserId = dto.UserId,
                PlaceId = dto.PlaceId,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            return Ok(new { isFavorite = true, message = "Đã lưu địa điểm vào sổ tay yêu thích" });
        }
    }

    /// <summary>
    /// Lấy danh sách tất cả các địa điểm mà một người dùng đã lưu vào sổ tay yêu thích.
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<PlaceResponseDto>>> GetUserFavorites(int userId)
    {
        var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
            return NotFound(new { message = $"Không tìm thấy người dùng với mã {userId}" });

        var favoritePlaces = await _context.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new PlaceResponseDto
            {
                Id = f.Place!.Id,
                Name = f.Place.Name,
                Address = f.Place.Address,
                ImageUrl = f.Place.ImageUrl,
                TicketPriceAvg = f.Place.TicketPriceAvg,
                RatingAvg = f.Place.RatingAvg,
                ProvinceName = f.Place.Province != null ? f.Place.Province.Name : string.Empty,
                CategoryName = f.Place.Category != null ? f.Place.Category.Name : string.Empty
            })
            .ToListAsync();

        return Ok(favoritePlaces);
    }
}