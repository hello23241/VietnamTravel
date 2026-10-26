using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelGuide.Api.Data;
using TravelGuide.Api.DTOs;
using TravelGuide.Api.Models;

namespace TravelGuide.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách tất cả đánh giá của một địa điểm du lịch cụ thể.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReviewResponseDto>>> GetReviewsByPlace([FromQuery] int placeId)
    {
        var placeExists = await _context.Places.AnyAsync(p => p.Id == placeId);
        if (!placeExists)
        {
            return NotFound(new { message = $"Không tìm thấy địa điểm với mã {placeId}" });
        }

        var reviews = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.PlaceId == placeId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewResponseDto
            {
                Id = r.Id,
                UserId = r.UserId,
                Username = r.User != null ? r.User.Username : string.Empty,
                UserFullname = r.User != null ? r.User.Fullname : string.Empty,
                UserAvatarUrl = r.User != null ? r.User.AvatarUrl : null,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(reviews);
    }

    /// <summary>
    /// Gửi đánh giá sao kèm nhận xét cho địa điểm (tự động tính lại điểm trung bình của địa điểm).
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReviewResponseDto>> AddReview([FromBody] ReviewCreateDto dto)
    {
        // 1. Kiểm tra User và Place có tồn tại trong hệ thống không
        var user = await _context.Users.FindAsync(dto.UserId);
        if (user == null)
            return BadRequest(new { message = $"Người dùng với mã {dto.UserId} không tồn tại" });

        var place = await _context.Places.FindAsync(dto.PlaceId);
        if (place == null)
            return BadRequest(new { message = $"Địa điểm với mã {dto.PlaceId} không tồn tại" });

        // 2. Thêm Review mới
        var review = new Review
        {
            UserId = dto.UserId,
            PlaceId = dto.PlaceId,
            Rating = dto.Rating,
            Comment = dto.Comment.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        // 3. Tự động tính toán lại điểm đánh giá trung bình (RatingAvg) cho Place
        var allRatings = await _context.Reviews
            .Where(r => r.PlaceId == dto.PlaceId)
            .Select(r => r.Rating)
            .ToListAsync();

        place.RatingAvg = (float)Math.Round(allRatings.Average(), 1);
        await _context.SaveChangesAsync();

        // 4. Trả về kết quả HTTP 201 Created
        var responseDto = new ReviewResponseDto
        {
            Id = review.Id,
            UserId = user.Id,
            Username = user.Username,
            UserFullname = user.Fullname,
            UserAvatarUrl = user.AvatarUrl,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };

        return StatusCode(StatusCodes.Status201Created, responseDto);
    }
    /// <summary>
    /// Xóa một đánh giá vi phạm và tự động tính lại điểm trung bình cho địa điểm (Dành cho Admin).
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
            return NotFound(new { message = $"Không tìm thấy đánh giá với mã {id}" });

        var placeId = review.PlaceId;
        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        // Tính lại điểm trung bình cho địa điểm sau khi xóa đánh giá
        var remainingRatings = await _context.Reviews
            .Where(r => r.PlaceId == placeId)
            .Select(r => r.Rating)
            .ToListAsync();

        var place = await _context.Places.FindAsync(placeId);
        if (place != null)
        {
            place.RatingAvg = remainingRatings.Any() 
                ? (float)Math.Round(remainingRatings.Average(), 1) 
                : 5.0f; // Mặc định 5.0 nếu không còn đánh giá nào
            await _context.SaveChangesAsync();
        }

        return NoContent(); // 204
    }
}