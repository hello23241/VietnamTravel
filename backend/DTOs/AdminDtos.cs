using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.DTOs;

// 1. Thống kê số liệu đếm tổng quan
public class DashboardStatsDto
{
    public int TotalPlaces { get; set; }
    public int TotalReviews { get; set; }
    public int TotalUsers { get; set; }
    public int TotalProvinces { get; set; }
    public double AverageRating { get; set; }
}

// 2. Thống kê trực quan phục vụ vẽ Biểu đồ (Pie/Bar Chart)
public class DashboardChartsDto
{
    // Số địa điểm theo miền (Bắc, Trung, Nam) để vẽ biểu đồ tròn (Pie Chart)
    public List<RegionStatDto> PlacesByRegion { get; set; } = new();

    // Phân bổ đánh giá theo số sao (1, 2, 3, 4, 5 sao) để vẽ Bar Chart
    public Dictionary<int, int> RatingDistribution { get; set; } = new();

    // Top địa điểm được lưu vào Sổ tay yêu thích nhiều nhất
    public List<TopPlaceDto> TopFavoritedPlaces { get; set; } = new();
}

public class RegionStatDto
{
    public string Region { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class TopPlaceDto
{
    public int PlaceId { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public string ProvinceName { get; set; } = string.Empty;
    public int FavoriteCount { get; set; }
}

// 3. DTO hiển thị danh sách người dùng cho Admin quản lý
public class AdminUserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Fullname { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalReviews { get; set; }
    public int TotalFavorites { get; set; }
}

// 4. DTO đánh giá chi tiết
public class AdminReviewDto
{
    public int Id { get; set; }
    public int PlaceId { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}

// 5. DTO thêm/sửa Tỉnh thành
public class SaveProvinceDto
{
    [Required(ErrorMessage = "Tên tỉnh/thành không được để trống")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vùng miền không được để trống (Bắc, Trung, Nam, Tây Nguyên)")]
    [MaxLength(50)]
    public string Region { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? BannerUrl { get; set; }
}

// 6. DTO thêm/sửa Danh mục
public class SaveCategoryDto
{
    [Required(ErrorMessage = "Tên danh mục không được để trống")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? IconUrl { get; set; }
}