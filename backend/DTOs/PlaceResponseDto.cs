namespace TravelGuide.Api.DTOs;

public class PlaceResponseDto
{
    public int Id { get; set; }
    public int ProvinceId { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public decimal TicketPriceAvg { get; set; }
    public string? BookingUrl { get; set; }
    public float RatingAvg { get; set; }
    public string ProvinceName { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
}