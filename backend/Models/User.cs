using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.Models;

public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Fullname { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? AvatarUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
}