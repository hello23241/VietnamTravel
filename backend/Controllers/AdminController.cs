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

    // =========================================================================
    // 1. NHÓM THỐNG KÊ & BIỂU ĐỒ (DASHBOARD & CHARTS)
    // =========================================================================

    /// <summary>
    /// Thống kê các chỉ số tổng quan (Số Place, Review, User, Tỉnh thành, Điểm TB).
    /// </summary>
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

    /// <summary>
    /// Dữ liệu vẽ biểu đồ: Tỷ lệ địa điểm theo miền, phân bổ điểm sao, Top điểm đến yêu thích.
    /// </summary>
    [HttpGet("chart-stats")]
    public async Task<ActionResult<DashboardChartsDto>> GetChartStats()
    {
        // 1. Phân bổ địa điểm theo Vùng miền
        var placesByRegion = await _context.Places
            .Include(p => p.Province)
            .GroupBy(p => p.Province != null ? p.Province.Region : "Khác")
            .Select(g => new RegionStatDto
            {
                Region = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        // 2. Phân bổ điểm đánh giá (1 -> 5 sao)
        var ratingCounts = await _context.Reviews
            .GroupBy(r => r.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Rating, x => x.Count);

        var ratingDistribution = new Dictionary<int, int>();
        for (int star = 1; star <= 5; star++)
        {
            ratingDistribution[star] = ratingCounts.GetValueOrDefault(star, 0);
        }

        // 3. Top 5 địa điểm có nhiều lượt thả tim nhất
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

    // =========================================================================
    // 2. NHÓM QUẢN LÝ NGƯỜI DÙNG (USER MANAGEMENT)
    // =========================================================================

    /// <summary>
    /// Lấy danh sách thành viên trong hệ thống kèm số lượng review và yêu thích.
    /// </summary>
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers([FromQuery] string? tuKhoa)
    {
        var query = _context.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(tuKhoa))
        {
            var kw = tuKhoa.Trim().ToLower();
            query = query.Where(u => u.Username.ToLower().Contains(kw) || u.Fullname.ToLower().Contains(kw));
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Username = u.Username,
                Fullname = u.Fullname,
                AvatarUrl = u.AvatarUrl,
                CreatedAt = u.CreatedAt,
                TotalReviews = u.Reviews.Count,
                TotalFavorites = u.Favorites.Count
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Xóa tài khoản người dùng vi phạm (Chặn xóa tài khoản admin mặc định).
    /// </summary>
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = $"Không tìm thấy người dùng với mã {id}" });

        if (user.Username.ToLower() == "admin")
            return BadRequest(new { message = "Không được phép xóa tài khoản Quản trị viên tối cao (admin)" });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Đã xóa người dùng '{user.Username}' thành công" });
    }

    // =========================================================================
    // 3. NHÓM KIỂM DUYỆT ĐÁNH GIÁ (REVIEWS MODERATION)
    // =========================================================================

    /// <summary>
    /// Lấy danh sách đánh giá có bộ lọc theo số sao hoặc ID địa điểm để phát hiện bài spam.
    /// </summary>
    [HttpGet("reviews")]
    public async Task<ActionResult<PagedResult<AdminReviewDto>>> GetAllReviews(
        [FromQuery] int? placeId,
        [FromQuery] int? rating,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 15)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 50);

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
                UserName = r.User != null ? r.User.Fullname : "Ẩn danh",
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

    /// <summary>
    /// Xóa một đánh giá vi phạm và tự động tính lại điểm trung bình cho địa điểm.
    /// </summary>
    [HttpDelete("reviews/{id}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
            return NotFound(new { message = "Không tìm thấy đánh giá cần xóa" });

        var placeId = review.PlaceId;
        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        var remainingReviews = await _context.Reviews
            .Where(r => r.PlaceId == placeId)
            .Select(r => r.Rating)
            .ToListAsync();

        var place = await _context.Places.FindAsync(placeId);
        if (place != null)
        {
            place.RatingAvg = remainingReviews.Count > 0
                ? (float)Math.Round(remainingReviews.Average(), 1)
                : 5.0f;
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Đã xóa đánh giá vi phạm thành công" });
    }

    // =========================================================================
    // 4. NHÓM QUẢN LÝ TỈNH THÀNH (PROVINCES MANAGEMENT)
    // =========================================================================

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

        return Ok(new { message = "Thêm tỉnh/thành mới thành công", province });
    }

    [HttpPut("provinces/{id}")]
    public async Task<IActionResult> UpdateProvince(int id, [FromBody] SaveProvinceDto dto)
    {
        var province = await _context.Provinces.FindAsync(id);
        if (province == null)
            return NotFound(new { message = $"Không tìm thấy tỉnh/thành với mã {id}" });

        province.Name = dto.Name.Trim();
        province.Region = dto.Region.Trim();
        province.BannerUrl = dto.BannerUrl?.Trim();

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật thông tin tỉnh/thành thành công", province });
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

    // =========================================================================
    // 5. NHÓM QUẢN LÝ THỂ LOẠI / DANH MỤC (CATEGORIES MANAGEMENT)
    // =========================================================================

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

        return Ok(new { message = "Thêm danh mục mới thành công", category });
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
        return Ok(new { message = "Cập nhật danh mục thành công", category });
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