using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.DTOs;

public class PlaceCreateDto
{
    [Required(ErrorMessage = "Vui lòng chọn tỉnh/thành phố")]
    public int ProvinceId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn danh mục")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "Tên địa điểm không được để trống")]
    [MaxLength(150, ErrorMessage = "Tên địa điểm tối đa 150 ký tự")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mô tả không được để trống")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Địa chỉ không được để trống")]
    [MaxLength(255, ErrorMessage = "Địa chỉ tối đa 255 ký tự")]
    public string Address { get; set; } = string.Empty;

    [Required(ErrorMessage = "Hình ảnh đại diện không được để trống")]
    [MaxLength(255, ErrorMessage = "Đường dẫn ảnh tối đa 255 ký tự")]
    public string ImageUrl { get; set; } = string.Empty;

    public double Latitude { get; set; }
    public double Longitude { get; set; }

    [Range(0, 100000000, ErrorMessage = "Giá vé tham khảo phải từ 0 trở lên")]
    public decimal TicketPriceAvg { get; set; }

    [MaxLength(255, ErrorMessage = "Liên kết booking tối đa 255 ký tự")]
    public string? BookingUrl { get; set; }
}