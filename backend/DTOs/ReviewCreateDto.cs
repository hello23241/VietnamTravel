using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.DTOs;

public class ReviewCreateDto
{
    [Required(ErrorMessage = "Mã người dùng không được để trống")]
    public int UserId { get; set; }

    [Required(ErrorMessage = "Mã địa điểm không được để trống")]
    public int PlaceId { get; set; }

    [Range(1, 5, ErrorMessage = "Điểm đánh giá phải từ 1 đến 5 sao")]
    public int Rating { get; set; }

    [Required(ErrorMessage = "Nội dung đánh giá không được để trống")]
    [MaxLength(1000, ErrorMessage = "Nội dung đánh giá tối đa 1000 ký tự")]
    public string Comment { get; set; } = string.Empty;
}