using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using TravelGuide.Api.DTOs;

namespace TravelGuide.Api.Services;

public class WeatherService : IWeatherService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;

    public WeatherService(HttpClient httpClient, IConfiguration configuration, IMemoryCache cache)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _cache = cache;
    }

    public async Task<WeatherResponseDto> GetWeatherByCoordinatesAsync(double latitude, double longitude)
    {
        var latKey = Math.Round(latitude, 3).ToString(CultureInfo.InvariantCulture);
        var lonKey = Math.Round(longitude, 3).ToString(CultureInfo.InvariantCulture);
        var cacheKey = $"weather_{latKey}_{lonKey}";

        if (_cache.TryGetValue(cacheKey, out WeatherResponseDto? cachedWeather) && cachedWeather != null)
        {
            return cachedWeather;
        }

        var apiKey = _configuration["OpenWeatherMap:ApiKey"];

        if (!string.IsNullOrWhiteSpace(apiKey) &&
            apiKey != "YOUR_API_KEY_HERE" &&
            apiKey != "YOUR_OPENWEATHERMAP_API_KEY_HERE")
        {
            try
            {
                var latStr = latitude.ToString(CultureInfo.InvariantCulture);
                var lonStr = longitude.ToString(CultureInfo.InvariantCulture);
                var url = $"https://api.openweathermap.org/data/2.5/weather?lat={latStr}&lon={lonStr}&units=metric&lang=vi&appid={apiKey}";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    using var stream = await response.Content.ReadAsStreamAsync();
                    using var doc = await JsonDocument.ParseAsync(stream);
                    var root = doc.RootElement;

                    var temp = root.GetProperty("main").GetProperty("temp").GetDouble();
                    var humidity = root.GetProperty("main").GetProperty("humidity").GetInt32();
                    var windSpeed = root.GetProperty("wind").GetProperty("speed").GetDouble();
                    var weatherElem = root.GetProperty("weather")[0];
                    var condition = weatherElem.GetProperty("description").GetString() ?? "Bình thường";
                    var iconCode = weatherElem.GetProperty("icon").GetString() ?? "01d";

                    var result = new WeatherResponseDto
                    {
                        Temperature = Math.Round(temp, 1),
                        Humidity = humidity,
                        WindSpeed = Math.Round(windSpeed, 1),
                        Condition = char.ToUpper(condition[0]) + condition[1..],
                        IconUrl = $"https://openweathermap.org/img/wn/{iconCode}@2x.png",
                        Recommendation = GenerateRecommendation(condition, temp)
                    };

                    _cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
                    return result;
                }
            }
            catch
            {
            }
        }

        var fallback = GenerateFallbackWeather(latitude, longitude);
        _cache.Set(cacheKey, fallback, TimeSpan.FromMinutes(10));
        return fallback;
    }

    private static string GenerateRecommendation(string condition, double temp)
    {
        var cond = condition.ToLower();
        if (cond.Contains("mưa") || cond.Contains("dông") || cond.Contains("sấm"))
            return "Dự báo có mưa - Nên mang theo ô dù, áo mưa và hạn chế tham gia các hoạt động mạo hiểm ngoài trời.";

        if (temp >= 33)
            return "Thời tiết nắng nóng gắt - Cần thoa kem chống nắng, mang kính râm và bổ sung đủ nước khi tham quan.";

        if (temp <= 18)
            return "Tiết trời se lạnh - Thích hợp ngắm cảnh, nên mang theo áo khoác ấm và khăn quàng.";

        return "Thời tiết mát mẻ, dễ chịu - Rất lý tưởng để đi bộ dạo mát, check-in chụp ảnh và trải nghiệm ẩm thực.";
    }

    private static WeatherResponseDto GenerateFallbackWeather(double latitude, double longitude)
    {
        var isNorth = latitude > 16.0;
        var temp = isNorth ? 24.5 : 30.2;

        return new WeatherResponseDto
        {
            Temperature = temp,
            Humidity = isNorth ? 78 : 65,
            WindSpeed = 3.2,
            Condition = isNorth ? "Mây rải rác, trời dịu mát" : "Nắng đẹp, trời quang đãng",
            IconUrl = isNorth ? "https://openweathermap.org/img/wn/02d@2x.png" : "https://openweathermap.org/img/wn/01d@2x.png",
            Recommendation = GenerateRecommendation(isNorth ? "mây" : "nắng", temp)
        };
    }
}