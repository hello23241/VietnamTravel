namespace TravelGuide.Api.DTOs;

/// <summary>
/// Lớp bọc kết quả phân trang dùng chung cho toàn bộ API.
/// </summary>
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);
}