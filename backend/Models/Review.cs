using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.Models;

public class Review
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public int PlaceId { get; set; }
    public Place? Place { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [Required]
    public string Comment { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}