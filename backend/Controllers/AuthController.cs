using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelGuide.Api.Data;
using TravelGuide.Api.DTOs;
using TravelGuide.Api.Models;

namespace TravelGuide.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private static bool IsDntuAdminEmail(string email)
    {
        return email.EndsWith("@dntu.edu.vn", StringComparison.OrdinalIgnoreCase) ||
               email.EndsWith(".dntu.edu.vn", StringComparison.OrdinalIgnoreCase);
    }

    [HttpPost("google")]
    public async Task<ActionResult<UserResponseDto>> GoogleLogin([FromBody] GoogleLoginRequestDto dto)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            var clientId = _configuration["GoogleAuth:ClientId"];
            var hasValidClientId = !string.IsNullOrWhiteSpace(clientId) &&
                                   !clientId.StartsWith("YOUR_GOOGLE_CLIENT_ID", StringComparison.OrdinalIgnoreCase);

            var validationSettings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = hasValidClientId ? new[] { clientId! } : null
            };

            payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, validationSettings);
        }
        catch (InvalidJwtException ex)
        {
            return Unauthorized(new { message = "Xác thực Google thất bại hoặc Token đã hết hạn", details = ex.Message });
        }

        var email = payload.Email.ToLower().Trim();
        var role = IsDntuAdminEmail(email) ? "Admin" : "User";

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user == null)
        {
            user = new User
            {
                Email = email,
                Fullname = payload.Name ?? email.Split('@')[0],
                AvatarUrl = payload.Picture ?? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(payload.Name ?? "User")}",
                Role = role,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
        }
        else
        {
            user.Fullname = payload.Name ?? user.Fullname;
            user.AvatarUrl = payload.Picture ?? user.AvatarUrl;
            user.Role = role;
        }

        await _context.SaveChangesAsync();

        return Ok(new UserResponseDto
        {
            Id = user.Id,
            Email = user.Email,
            Fullname = user.Fullname,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        });
    }

    /// <summary>
    /// Nhận #id_token từ Google OAuth 2.0 và chuyển tiếp về Deep Link của Mobile App
    /// </summary>
    [HttpGet("google-callback")]
    public ContentResult GoogleMobileCallback()
    {
        const string html = @"<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'/>
  <meta name='viewport' content='width=device-width, initial-scale=1'/>
  <title>Đang kết nối VietGuide...</title>
  <style>
    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; background: #f8fafc; color: #0f172a; text-align: center; padding: 20px; }
    .btn { margin-top: 16px; padding: 12px 24px; background: #059669; color: #fff; text-decoration: none; border-radius: 12px; font-weight: bold; display: none; }
  </style>
</head>
<body>
  <h3>Đang đồng bộ tài khoản Google về VietGuide...</h3>
  <a id='fallbackBtn' class='btn' href='#'>Chạm vào đây để quay lại ứng dụng</a>
  <script>
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');
    const state = params.get('state');
    if (idToken && state) {
      const sep = state.includes('?') ? '&' : '?';
      const deepLink = state + sep + 'id_token=' + encodeURIComponent(idToken);
      const btn = document.getElementById('fallbackBtn');
      btn.href = deepLink;
      btn.style.display = 'inline-block';
      window.location.replace('/api/Auth/google-redirect?id_token=' + encodeURIComponent(idToken) + '&state=' + encodeURIComponent(state));
    } else {
      document.body.innerHTML = '<h3>Xác thực thất bại hoặc bị hủy. Vui lòng đóng cửa sổ này.</h3>';
    }
  </script>
</body>
</html>";
        return Content(html, "text/html");
    }

    [HttpGet("google-redirect")]
    public IActionResult GoogleMobileRedirect([FromQuery] string idToken, [FromQuery] string state)
    {
        var separator = state.Contains('?') ? "&" : "?";
        var targetUrl = $"{state}{separator}id_token={Uri.EscapeDataString(idToken)}";
        return Redirect(targetUrl);
    }
}