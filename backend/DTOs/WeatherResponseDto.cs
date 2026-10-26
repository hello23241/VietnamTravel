namespace TravelGuide.Api.DTOs;

public class WeatherResponseDto
{
    public double Temperature { get; set; }     // Độ C
    public int Humidity { get; set; }           // % Độ ẩm
    public double WindSpeed { get; set; }       // m/s
    public string Condition { get; set; } = string.Empty; // Nắng, Mưa, Mây rải rác...
    public string IconUrl { get; set; } = string.Empty;   // URL biểu tượng thời tiết
    public string Recommendation { get; set; } = string.Empty; // Khuyến nghị du lịch
}