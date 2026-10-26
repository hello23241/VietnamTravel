using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.DTOs;

public class FavoriteToggleDto
{
    [Required(ErrorMessage = "Mã người dùng không được để trống")]
    public int UserId { get; set; }

    [Required(ErrorMessage = "Mã địa điểm không được để trống")]
    public int PlaceId { get; set; }
}