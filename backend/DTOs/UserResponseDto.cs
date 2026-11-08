namespace TravelGuide.Api.DTOs;

public class UserResponseDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Fullname { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "User";
    public DateTime CreatedAt { get; set; }
}