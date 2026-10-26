namespace TravelGuide.Api.DTOs;

public class ReviewResponseDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string UserFullname { get; set; } = string.Empty;
    public string? UserAvatarUrl { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}