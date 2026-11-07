using System.Text.Json;

namespace TravelGuide.Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = Guid.NewGuid().ToString();
        _logger.LogError(exception, "Loi he thong {TraceId}: {Message}", traceId, exception.Message);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var response = new
        {
            message = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
            traceId
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}