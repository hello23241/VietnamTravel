using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TravelGuide.Api.Models;

public class Place
{
    [Key]
    public int Id { get; set; }

    public int ProvinceId { get; set; }
    public Province? Province { get; set; }

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string ImageUrl { get; set; } = string.Empty;

    public double Latitude { get; set; }
    public double Longitude { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal TicketPriceAvg { get; set; }

    [MaxLength(255)]
    public string? BookingUrl { get; set; }

    public float RatingAvg { get; set; } = 5.0f;

    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
}