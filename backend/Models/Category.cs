using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.Models;

public class Category
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? IconUrl { get; set; }

    public ICollection<Place> Places { get; set; } = new List<Place>();
}