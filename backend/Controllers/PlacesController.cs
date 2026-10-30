using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelGuide.Api.Data;
using TravelGuide.Api.DTOs;
using TravelGuide.Api.Models;
using TravelGuide.Api.Services;

namespace TravelGuide.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlacesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWeatherService _weatherService;

    public PlacesController(AppDbContext context, IWeatherService weatherService)
    {
        _context = context;
        _weatherService = weatherService;
    }

    /// <summary>
    /// READ (List): Lấy danh sách địa điểm có lọc theo tỉnh, danh mục, từ khóa, sắp xếp và phân trang.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<PlaceResponseDto>>> GetPlaces(
        [FromQuery] int? provinceId,
        [FromQuery] int? categoryId,
        [FromQuery] string? tuKhoa,
        [FromQuery] string? sortBy,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        pageSize = Math.Clamp(pageSize, 1, 50);
        pageNumber = Math.Max(1, pageNumber);

        var query = _context.Places.AsNoTracking().AsQueryable();

        // 1. Lọc (Filter)
        if (provinceId.HasValue)
            query = query.Where(p => p.ProvinceId == provinceId.Value);

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(tuKhoa))
        {
            var kw = tuKhoa.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(kw) || p.Address.ToLower().Contains(kw));
        }

        var totalItems = await query.CountAsync();

        // 2. Sắp xếp (Sort)
        query = sortBy?.ToLower() switch
        {
            "gia" or "giatang" => query.OrderBy(p => p.TicketPriceAvg),
            "giagiam" => query.OrderByDescending(p => p.TicketPriceAvg),
            "danhgia" or "rating" => query.OrderByDescending(p => p.RatingAvg),
            "ten" => query.OrderBy(p => p.Name),
            _ => query.OrderBy(p => p.Id)
        };

        // 3. Phân trang (Paging) & Ánh xạ DTO
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PlaceResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Address = p.Address,
                ImageUrl = p.ImageUrl,
                TicketPriceAvg = p.TicketPriceAvg,
                RatingAvg = p.RatingAvg,
                ProvinceName = p.Province != null ? p.Province.Name : string.Empty,
                Region = p.Province != null ? p.Province.Region : string.Empty,
                CategoryName = p.Category != null ? p.Category.Name : string.Empty
            })
            .ToListAsync();

        return Ok(new PagedResult<PlaceResponseDto>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalItems = totalItems
        });
    }

    /// <summary>
    /// READ (Detail): Lấy thông tin chi tiết một địa điểm theo Id kèm tọa độ GPS.
    /// </summary>
    [HttpGet("{id}", Name = "GetPlaceById")]
    public async Task<ActionResult<PlaceDetailResponseDto>> GetPlaceById(int id)
    {
        var place = await _context.Places
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new PlaceDetailResponseDto
            {
                Id = p.Id,
                ProvinceId = p.ProvinceId,
                ProvinceName = p.Province != null ? p.Province.Name : string.Empty,
                Region = p.Province != null ? p.Province.Region : string.Empty,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                Name = p.Name,
                Description = p.Description,
                Address = p.Address,
                ImageUrl = p.ImageUrl,
                Latitude = p.Latitude,
                Longitude = p.Longitude,
                TicketPriceAvg = p.TicketPriceAvg,
                BookingUrl = p.BookingUrl,
                RatingAvg = p.RatingAvg,
                TotalReviews = p.Reviews.Count
            })
            .FirstOrDefaultAsync();

        if (place == null)
            return NotFound(new { message = $"Không tìm thấy địa điểm với mã {id}" });

        return Ok(place);
    }

    /// <summary>
    /// CREATE: Thêm mới một địa điểm du lịch (Dành cho Quản trị viên).
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PlaceDetailResponseDto>> CreatePlace([FromBody] PlaceCreateDto dto)
    {
        // 1. Kiểm tra tồn tại khóa ngoại
        var province = await _context.Provinces.FindAsync(dto.ProvinceId);
        if (province == null)
            return BadRequest(new { message = $"Tỉnh/thành với mã {dto.ProvinceId} không tồn tại" });

        var category = await _context.Categories.FindAsync(dto.CategoryId);
        if (category == null)
            return BadRequest(new { message = $"Danh mục với mã {dto.CategoryId} không tồn tại" });

        // 2. Tạo Entity mới
        var place = new Place
        {
            ProvinceId = dto.ProvinceId,
            CategoryId = dto.CategoryId,
            Name = dto.Name.Trim(),
            Description = dto.Description.Trim(),
            Address = dto.Address.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) 
                ? "https://images.unsplash.com/photo-1528127269322-539801943592" 
                : dto.ImageUrl.Trim(),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            TicketPriceAvg = dto.TicketPriceAvg,
            BookingUrl = dto.BookingUrl,
            RatingAvg = 5.0f
        };

        _context.Places.Add(place);
        await _context.SaveChangesAsync();

        // 3. Trả về HTTP 201 kèm đầy đủ thông tin Tỉnh thành và Danh mục
        var responseDto = new PlaceDetailResponseDto
        {
            Id = place.Id,
            ProvinceId = place.ProvinceId,
            ProvinceName = province.Name,
            Region = province.Region,
            CategoryId = place.CategoryId,
            CategoryName = category.Name,
            Name = place.Name,
            Description = place.Description,
            Address = place.Address,
            ImageUrl = place.ImageUrl,
            Latitude = place.Latitude,
            Longitude = place.Longitude,
            TicketPriceAvg = place.TicketPriceAvg,
            BookingUrl = place.BookingUrl,
            RatingAvg = place.RatingAvg,
            TotalReviews = 0
        };

        return CreatedAtAction(nameof(GetPlaceById), new { id = place.Id }, responseDto);
    }

    /// <summary>
    /// UPDATE: Cập nhật thông tin địa điểm theo Id.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePlace(int id, [FromBody] PlaceCreateDto dto)
    {
        var place = await _context.Places.FindAsync(id);
        if (place == null)
            return NotFound(new { message = $"Không tìm thấy địa điểm với mã {id}" });

        var provinceExists = await _context.Provinces.AnyAsync(p => p.Id == dto.ProvinceId);
        if (!provinceExists)
            return BadRequest(new { message = $"Tỉnh/thành với mã {dto.ProvinceId} không tồn tại" });

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = $"Danh mục với mã {dto.CategoryId} không tồn tại" });

        place.ProvinceId = dto.ProvinceId;
        place.CategoryId = dto.CategoryId;
        place.Name = dto.Name.Trim();
        place.Description = dto.Description.Trim();
        place.Address = dto.Address.Trim();
        place.ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? place.ImageUrl : dto.ImageUrl.Trim();
        place.Latitude = dto.Latitude;
        place.Longitude = dto.Longitude;
        place.TicketPriceAvg = dto.TicketPriceAvg;
        place.BookingUrl = dto.BookingUrl;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật địa điểm thành công" });
    }

    /// <summary>
    /// DELETE: Xóa một địa điểm theo Id (Cascade tự động xóa Đánh giá và Yêu thích liên quan).
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlace(int id)
    {
        var place = await _context.Places.FindAsync(id);
        if (place == null)
            return NotFound(new { message = $"Không tìm thấy địa điểm với mã {id}" });

        _context.Places.Remove(place);
        await _context.SaveChangesAsync();

        return NoContent(); // HTTP 204
    }

    /// <summary>
    /// WEATHER: Lấy dự báo thời tiết thời gian thực và khuyến nghị du lịch tại địa điểm.
    /// </summary>
    [HttpGet("{id}/weather")]
    public async Task<ActionResult<WeatherResponseDto>> GetPlaceWeather(int id)
    {
        var place = await _context.Places.FindAsync(id);
        if (place == null)
            return NotFound(new { message = $"Không tìm thấy địa điểm với mã {id}" });

        var weather = await _weatherService.GetWeatherByCoordinatesAsync(place.Latitude, place.Longitude);
        return Ok(weather);
    }
}