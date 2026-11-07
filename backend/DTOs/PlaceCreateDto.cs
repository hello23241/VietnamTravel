using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.DTOs;

public class PlaceCreateDto
{
    [Required(ErrorMessage = "Vui lòng chọn tỉnh/thành phố")]
    [Range(1, int.MaxValue, ErrorMessage = "Mã tỉnh/thành phố không hợp lệ")]
    public int ProvinceId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn danh mục")]
    [Range(1, int.MaxValue, ErrorMessage = "Mã danh mục không hợp lệ")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "Tên địa điểm không được để trống")]
    [MaxLength(150, ErrorMessage = "Tên địa điểm tối đa 150 ký tự")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mô tả không được để trống")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Địa chỉ không được để trống")]
    [MaxLength(255, ErrorMessage = "Địa chỉ tối đa 255 ký tự")]
    public string Address { get; set; } = string.Empty;

    [MaxLength(255, ErrorMessage = "Đường dẫn ảnh tối đa 255 ký tự")]
    public string? ImageUrl { get; set; }

    [Range(-90, 90, ErrorMessage = "Vĩ độ phải nằm trong khoảng -90 đến 90")]
    public double Latitude { get; set; }

    [Range(-180, 180, ErrorMessage = "Kinh độ phải nằm trong khoảng -180 đến 180")]
    public double Longitude { get; set; }

    [Range(0, 100000000, ErrorMessage = "Giá vé tham khảo phải từ 0 trở lên")]
    public decimal TicketPriceAvg { get; set; }

    [MaxLength(255, ErrorMessage = "Liên kết booking tối đa 255 ký tự")]
    public string? BookingUrl { get; set; }
}