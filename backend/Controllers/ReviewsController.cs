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

    [HttpPost]
    public async Task<ActionResult<ReviewResponseDto>> AddReview([FromBody] ReviewCreateDto dto)
    {
        var user = await _context.Users.FindAsync(dto.UserId);
        if (user == null)
            return BadRequest(new { message = $"Người dùng với mã {dto.UserId} không tồn tại" });

        var place = await _context.Places.FindAsync(dto.PlaceId);
        if (place == null)
            return BadRequest(new { message = $"Địa điểm với mã {dto.PlaceId} không tồn tại" });

        var existingRatings = await _context.Reviews
            .Where(r => r.PlaceId == dto.PlaceId)
            .Select(r => r.Rating)
            .ToListAsync();

        existingRatings.Add(dto.Rating);
        place.RatingAvg = (float)Math.Round(existingRatings.Average(), 1);

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

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
            return NotFound(new { message = $"Không tìm thấy đánh giá với mã {id}" });

        var placeId = review.PlaceId;
        var remainingRatings = await _context.Reviews
            .Where(r => r.PlaceId == placeId && r.Id != id)
            .Select(r => r.Rating)
            .ToListAsync();

        var place = await _context.Places.FindAsync(placeId);
        if (place != null)
        {
            place.RatingAvg = remainingRatings.Count > 0
                ? (float)Math.Round(remainingRatings.Average(), 1)
                : 5.0f;
        }

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}