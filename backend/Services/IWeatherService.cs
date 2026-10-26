using TravelGuide.Api.DTOs;

namespace TravelGuide.Api.Services;

public interface IWeatherService
{
    Task<WeatherResponseDto> GetWeatherByCoordinatesAsync(double latitude, double longitude);
}