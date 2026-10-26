namespace TravelGuide.Api.DTOs;

public class UserResponseDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Fullname { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}