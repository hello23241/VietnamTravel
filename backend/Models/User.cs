using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.Models;

public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty; // Định danh duy nhất từ Google

    [Required]
    [MaxLength(100)]
    public string Fullname { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? AvatarUrl { get; set; }

    [MaxLength(20)]
    public string Role { get; set; } = "User"; // "Admin" hoặc "User"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
}