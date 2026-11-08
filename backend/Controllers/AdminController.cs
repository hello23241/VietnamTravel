using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelGuide.Api.Data;
using TravelGuide.Api.DTOs;
using TravelGuide.Api.Models;

namespace TravelGuide.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard-stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
    {
        var totalPlaces = await _context.Places.CountAsync();
        var totalReviews = await _context.Reviews.CountAsync();
        var totalUsers = await _context.Users.CountAsync();
        var totalProvinces = await _context.Provinces.CountAsync();

        var avgRating = totalReviews > 0
            ? await _context.Reviews.AverageAsync(r => (double)r.Rating)
            : 0;

        return Ok(new DashboardStatsDto
        {
            TotalPlaces = totalPlaces,
            TotalReviews = totalReviews,
            TotalUsers = totalUsers,
            TotalProvinces = totalProvinces,
            AverageRating = Math.Round(avgRating, 1)
        });
    }

    [HttpGet("chart-stats")]
    public async Task<ActionResult<DashboardChartsDto>> GetChartStats()
    {
        var placesByRegion = await _context.Places
            .Include(p => p.Province)
            .GroupBy(p => p.Province != null ? p.Province.Region : "Khác")
            .Select(g => new RegionStatDto
            {
                Region = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        var ratingCounts = await _context.Reviews
            .GroupBy(r => r.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Rating, x => x.Count);

        var ratingDistribution = new Dictionary<int, int>();
        for (int star = 1; star <= 5; star++)
        {
            ratingDistribution[star] = ratingCounts.GetValueOrDefault(star, 0);
        }

        var topFavorited = await _context.Places
            .AsNoTracking()
            .Select(p => new TopPlaceDto
            {
                PlaceId = p.Id,
                PlaceName = p.Name,
                ProvinceName = p.Province != null ? p.Province.Name : string.Empty,
                FavoriteCount = p.Favorites.Count
            })
            .OrderByDescending(p => p.FavoriteCount)
            .Take(5)
            .ToListAsync();

        return Ok(new DashboardChartsDto
        {
            PlacesByRegion = placesByRegion,
            RatingDistribution = ratingDistribution,
            TopFavoritedPlaces = topFavorited
        });
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers([FromQuery] string? tuKhoa)
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Email = u.Email,
                Fullname = u.Fullname,
                AvatarUrl = u.AvatarUrl,
                Role = u.Role,
                CreatedAt = u.CreatedAt,
                TotalReviews = u.Reviews.Count,
                TotalFavorites = u.Favorites.Count
            })
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(tuKhoa))
        {
            var kw = tuKhoa.Trim();
            users = users
                .Where(u =>
                    u.Email.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                    u.Fullname.Contains(kw, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        return Ok(users);
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = $"Không tìm thấy người dùng với mã {id}" });

        if (user.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Không được phép xóa tài khoản có quyền Quản trị viên (Admin)" });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Đã xóa người dùng '{user.Email}' thành công" });
    }

    [HttpGet("reviews")]
    public async Task<ActionResult<PagedResult<AdminReviewDto>>> GetAllReviews(
        [FromQuery] int? placeId,
        [FromQuery] int? rating,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 15)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Reviews.AsNoTracking().AsQueryable();

        if (placeId.HasValue)
            query = query.Where(r => r.PlaceId == placeId.Value);

        if (rating.HasValue)
            query = query.Where(r => r.Rating == rating.Value);

        var totalItems = await query.CountAsync();

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new AdminReviewDto
            {
                Id = r.Id,
                PlaceId = r.PlaceId,
                PlaceName = r.Place != null ? r.Place.Name : "Địa điểm đã xóa",
                UserId = r.UserId,
                UserEmail = r.User != null ? r.User.Email : "ẩn_danh",
                UserFullname = r.User != null ? r.User.Fullname : "Ẩn danh",
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(new PagedResult<AdminReviewDto>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalItems = totalItems
        });
    }

    [HttpDelete("reviews/{id}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
            return NotFound(new { message = "Không tìm thấy đánh giá cần xóa" });

        var placeId = review.PlaceId;
        var remainingReviews = await _context.Reviews
            .Where(r => r.PlaceId == placeId && r.Id != id)
            .Select(r => r.Rating)
            .ToListAsync();

        var place = await _context.Places.FindAsync(placeId);
        if (place != null)
        {
            place.RatingAvg = remainingReviews.Count > 0
                ? (float)Math.Round(remainingReviews.Average(), 1)
                : 5.0f;
        }

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã xóa đánh giá vi phạm thành công" });
    }

    [HttpPost("provinces")]
    public async Task<IActionResult> CreateProvince([FromBody] SaveProvinceDto dto)
    {
        var province = new Province
        {
            Name = dto.Name.Trim(),
            Region = dto.Region.Trim(),
            BannerUrl = dto.BannerUrl?.Trim()
        };

        _context.Provinces.Add(province);
        await _context.SaveChangesAsync();

        var responseDto = new ProvinceResponseDto
        {
            Id = province.Id,
            Name = province.Name,
            Region = province.Region,
            BannerUrl = province.BannerUrl,
            TotalPlaces = 0
        };

        return StatusCode(StatusCodes.Status201Created, new { message = "Thêm tỉnh/thành mới thành công", province = responseDto });
    }

    [HttpPut("provinces/{id}")]
    public async Task<IActionResult> UpdateProvince(int id, [FromBody] SaveProvinceDto dto)
    {
        var province = await _context.Provinces.Include(p => p.Places).FirstOrDefaultAsync(p => p.Id == id);
        if (province == null)
            return NotFound(new { message = $"Không tìm thấy tỉnh/thành với mã {id}" });

        province.Name = dto.Name.Trim();
        province.Region = dto.Region.Trim();
        province.BannerUrl = dto.BannerUrl?.Trim();

        await _context.SaveChangesAsync();

        var responseDto = new ProvinceResponseDto
        {
            Id = province.Id,
            Name = province.Name,
            Region = province.Region,
            BannerUrl = province.BannerUrl,
            TotalPlaces = province.Places.Count
        };

        return Ok(new { message = "Cập nhật thông tin tỉnh/thành thành công", province = responseDto });
    }

    [HttpDelete("provinces/{id}")]
    public async Task<IActionResult> DeleteProvince(int id)
    {
        var province = await _context.Provinces.Include(p => p.Places).FirstOrDefaultAsync(p => p.Id == id);
        if (province == null)
            return NotFound(new { message = $"Không tìm thấy tỉnh/thành với mã {id}" });

        if (province.Places.Any())
            return BadRequest(new { message = $"Không thể xóa tỉnh '{province.Name}' vì vẫn còn {province.Places.Count} địa điểm trực thuộc. Vui lòng gỡ hoặc chuyển địa điểm trước." });

        _context.Provinces.Remove(province);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã xóa tỉnh/thành thành công" });
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] SaveCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name.Trim(),
            IconUrl = dto.IconUrl?.Trim()
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var responseDto = new CategoryResponseDto
        {
            Id = category.Id,
            Name = category.Name,
            IconUrl = category.IconUrl
        };

        return StatusCode(StatusCodes.Status201Created, new { message = "Thêm danh mục mới thành công", category = responseDto });
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] SaveCategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound(new { message = $"Không tìm thấy danh mục với mã {id}" });

        category.Name = dto.Name.Trim();
        category.IconUrl = dto.IconUrl?.Trim();

        await _context.SaveChangesAsync();

        var responseDto = new CategoryResponseDto
        {
            Id = category.Id,
            Name = category.Name,
            IconUrl = category.IconUrl
        };

        return Ok(new { message = "Cập nhật danh mục thành công", category = responseDto });
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.Categories.Include(c => c.Places).FirstOrDefaultAsync(c => c.Id == id);
        if (category == null)
            return NotFound(new { message = $"Không tìm thấy danh mục với mã {id}" });

        if (category.Places.Any())
            return BadRequest(new { message = $"Không thể xóa danh mục '{category.Name}' vì đang có {category.Places.Count} địa điểm thuộc danh mục này." });

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã xóa danh mục thành công" });
    }
}