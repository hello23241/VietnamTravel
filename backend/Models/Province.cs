using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.Models;

public class Province
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Region { get; set; } = string.Empty; // Bắc, Trung, Nam

    [MaxLength(255)]
    public string? BannerUrl { get; set; }

    public ICollection<Place> Places { get; set; } = new List<Place>();
}