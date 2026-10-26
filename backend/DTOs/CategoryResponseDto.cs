namespace TravelGuide.Api.DTOs;

public class CategoryResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
}