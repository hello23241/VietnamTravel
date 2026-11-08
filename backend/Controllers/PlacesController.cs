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

    public static string GetFullImageUrl(string? dbUrl)
    {
        if (string.IsNullOrWhiteSpace(dbUrl) || dbUrl.Trim().Equals("default-placeholder.jpg", StringComparison.OrdinalIgnoreCase))
            return "https://images.unsplash.com/photo-1528127269322-539801943592";

        var trimmed = dbUrl.Trim();

        if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        const string baseUrl = "https://cdn.jsdelivr.net/gh/hello23241/VietnamTravel@main/images/";
        return $"{baseUrl}{trimmed.TrimStart('/')}";
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<PlaceResponseDto>>> GetPlaces(
        [FromQuery] int? provinceId,
        [FromQuery] int? categoryId,
        [FromQuery] string? region,
        [FromQuery] string? tuKhoa,
        [FromQuery] string? sortBy,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        pageNumber = Math.Max(1, pageNumber);

        var query = _context.Places.AsNoTracking().AsQueryable();

        if (provinceId.HasValue)
            query = query.Where(p => p.ProvinceId == provinceId.Value);

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        var projectedList = await query
            .Select(p => new PlaceResponseDto
            {
                Id = p.Id,
                ProvinceId = p.ProvinceId,
                CategoryId = p.CategoryId,
                Name = p.Name,
                Description = p.Description,
                Address = p.Address,
                ImageUrl = p.ImageUrl, // Sẽ được xử lý URL bên dưới
                Latitude = p.Latitude,
                Longitude = p.Longitude,
                TicketPriceAvg = p.TicketPriceAvg,
                BookingUrl = p.BookingUrl,
                RatingAvg = p.RatingAvg,
                ProvinceName = p.Province != null ? p.Province.Name : string.Empty,
                Region = p.Province != null ? p.Province.Region : string.Empty,
                CategoryName = p.Category != null ? p.Category.Name : string.Empty
            })
            .ToListAsync();

        IEnumerable<PlaceResponseDto> filtered = projectedList;

        if (!string.IsNullOrWhiteSpace(region) && !region.Trim().Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var reg = region.Trim();
            filtered = filtered.Where(p => p.Region.Equals(reg, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(tuKhoa))
        {
            var kw = tuKhoa.Trim();
            filtered = filtered.Where(p =>
                p.Name.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                p.Address.Contains(kw, StringComparison.OrdinalIgnoreCase) ||
                p.ProvinceName.Contains(kw, StringComparison.OrdinalIgnoreCase));
        }

        filtered = sortBy?.ToLower() switch
        {
            "gia" or "giatang" => filtered.OrderBy(p => p.TicketPriceAvg).ThenBy(p => p.Id),
            "giagiam" => filtered.OrderByDescending(p => p.TicketPriceAvg).ThenBy(p => p.Id),
            "danhgia" or "rating" => filtered.OrderByDescending(p => p.RatingAvg).ThenBy(p => p.Id),
            "ten" => filtered.OrderBy(p => p.Name).ThenBy(p => p.Id),
            _ => filtered.OrderBy(p => p.Id)
        };

        var finalList = filtered.ToList();
        var totalItems = finalList.Count;

        var items = finalList
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p =>
            {
                // Gọi hàm nội suy ảnh cho từng địa điểm
                p.ImageUrl = GetFullImageUrl(p.ImageUrl);
                return p;
            })
            .ToList();

        return Ok(new PagedResult<PlaceResponseDto>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalItems = totalItems
        });
    }

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
                ImageUrl = p.ImageUrl, // Sẽ được xử lý URL bên dưới
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

        // Nối link CDN vào slug ảnh
        place.ImageUrl = GetFullImageUrl(place.ImageUrl);

        return Ok(place);
    }

    [HttpPost]
    public async Task<ActionResult<PlaceDetailResponseDto>> CreatePlace([FromBody] PlaceCreateDto dto)
    {
        var province = await _context.Provinces.FindAsync(dto.ProvinceId);
        if (province == null)
            return BadRequest(new { message = $"Tỉnh/thành với mã {dto.ProvinceId} không tồn tại" });

        var category = await _context.Categories.FindAsync(dto.CategoryId);
        if (category == null)
            return BadRequest(new { message = $"Danh mục với mã {dto.CategoryId} không tồn tại" });

        var place = new Place
        {
            ProvinceId = dto.ProvinceId,
            CategoryId = dto.CategoryId,
            Name = dto.Name.Trim(),
            Description = dto.Description.Trim(),
            Address = dto.Address.Trim(),
            // Lưu trực tiếp chuỗi được nhập vào (slug)
            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl)
                ? "default-placeholder.jpg"
                : dto.ImageUrl.Trim(),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            TicketPriceAvg = dto.TicketPriceAvg,
            BookingUrl = string.IsNullOrWhiteSpace(dto.BookingUrl) ? null : dto.BookingUrl.Trim(),
            RatingAvg = 5.0f
        };

        _context.Places.Add(place);
        await _context.SaveChangesAsync();

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
            // Trả về link ảnh đầy đủ sau khi vừa tạo xong
            ImageUrl = GetFullImageUrl(place.ImageUrl),
            Latitude = place.Latitude,
            Longitude = place.Longitude,
            TicketPriceAvg = place.TicketPriceAvg,
            BookingUrl = place.BookingUrl,
            RatingAvg = place.RatingAvg,
            TotalReviews = 0
        };

        return CreatedAtAction(nameof(GetPlaceById), new { id = place.Id }, responseDto);
    }

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
        
        // Cập nhật lại slug mới nếu có
        place.ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? place.ImageUrl : dto.ImageUrl.Trim();
        
        place.Latitude = dto.Latitude;
        place.Longitude = dto.Longitude;
        place.TicketPriceAvg = dto.TicketPriceAvg;

        if (dto.BookingUrl != null)
        {
            place.BookingUrl = string.IsNullOrWhiteSpace(dto.BookingUrl) ? null : dto.BookingUrl.Trim();
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật địa điểm thành công" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlace(int id)
    {
        var place = await _context.Places.FindAsync(id);
        if (place == null)
            return NotFound(new { message = $"Không tìm thấy địa điểm với mã {id}" });

        _context.Places.Remove(place);
        await _context.SaveChangesAsync();

        return NoContent();
    }

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