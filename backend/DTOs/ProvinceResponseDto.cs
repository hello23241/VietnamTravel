namespace TravelGuide.Api.DTOs;

public class ProvinceResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string? BannerUrl { get; set; }
    public int TotalPlaces { get; set; }
}