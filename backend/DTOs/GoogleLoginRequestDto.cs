using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.DTOs;

public class GoogleLoginRequestDto
{
    [Required(ErrorMessage = "IdToken từ Google không được để trống")]
    public string IdToken { get; set; } = string.Empty;
}

public class GoogleMobileCompleteDto
{
    [Required]
    public string SessionId { get; set; } = string.Empty;

    [Required]
    public string IdToken { get; set; } = string.Empty;
}