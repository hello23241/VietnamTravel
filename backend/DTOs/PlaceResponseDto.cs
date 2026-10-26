namespace TravelGuide.Api.DTOs;

public class PlaceResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public decimal TicketPriceAvg { get; set; }
    public float RatingAvg { get; set; }
    public string ProvinceName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
}