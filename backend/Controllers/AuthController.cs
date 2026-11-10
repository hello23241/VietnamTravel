using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
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
    private readonly IMemoryCache _cache;

    public AuthController(AppDbContext context, IConfiguration configuration, IMemoryCache cache)
    {
        _context = context;
        _configuration = configuration;
        _cache = cache;
    }

    private static bool IsDntuAdminEmail(string email)
    {
        return email.EndsWith("@dntu.edu.vn", StringComparison.OrdinalIgnoreCase) ||
               email.EndsWith(".dntu.edu.vn", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Hàm dùng chung để xác thực Google ID Token và đồng bộ User vào SQLite
    /// </summary>
    private async Task<UserResponseDto> VerifyAndUpsertGoogleUserAsync(string idToken)
    {
        var clientId = _configuration["GoogleAuth:ClientId"];
        var hasValidClientId = !string.IsNullOrWhiteSpace(clientId) &&
                               !clientId.StartsWith("YOUR_GOOGLE_CLIENT_ID", StringComparison.OrdinalIgnoreCase);

        var validationSettings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = hasValidClientId ? new[] { clientId! } : null
        };

        var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, validationSettings);

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

        return new UserResponseDto
        {
            Id = user.Id,
            Email = user.Email,
            Fullname = user.Fullname,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }

    /// <summary>
    /// Đăng nhập bằng Google ID Token (Dùng cho Web và Mobile)
    /// </summary>
    [HttpPost("google")]
    public async Task<ActionResult<UserResponseDto>> GoogleLogin([FromBody] GoogleLoginRequestDto dto)
    {
        try
        {
            var userDto = await VerifyAndUpsertGoogleUserAsync(dto.IdToken);
            return Ok(userDto);
        }
        catch (InvalidJwtException ex)
        {
            return Unauthorized(new { message = "Xác thực Google thất bại hoặc Token đã hết hạn", details = ex.Message });
        }
    }

    /// <summary>
    /// Nhận kết quả xác thực từ trang callback trên trình duyệt Mobile và lưu vào MemoryCache
    /// </summary>
    [HttpPost("google-mobile-complete")]
    public async Task<ActionResult<UserResponseDto>> CompleteMobileGoogleLogin([FromBody] GoogleMobileCompleteDto dto)
    {
        try
        {
            var userDto = await VerifyAndUpsertGoogleUserAsync(dto.IdToken);
            _cache.Set($"google_session_{dto.SessionId}", userDto, TimeSpan.FromMinutes(5));
            return Ok(userDto);
        }
        catch (InvalidJwtException ex)
        {
            return Unauthorized(new { message = "Token Google không hợp lệ", details = ex.Message });
        }
    }

    /// <summary>
    /// Mobile App gọi endpoint này để lấy thông tin User vừa xác thực trên trình duyệt
    /// </summary>
    [HttpGet("google-session/{sessionId}")]
    public ActionResult<UserResponseDto> GetMobileGoogleSession(string sessionId)
    {
        if (_cache.TryGetValue($"google_session_{sessionId}", out UserResponseDto? userDto) && userDto != null)
        {
            _cache.Remove($"google_session_{sessionId}");
            return Ok(userDto);
        }

        return NotFound(new { message = "Phiên đăng nhập chưa hoàn tất" });
    }

    /// <summary>
    /// Thực hiện HTTP 302 Redirect về Deep Link exp:// để Android tự mở lại Expo Go
    /// </summary>
    [HttpGet("google-redirect")]
    public IActionResult GoogleMobileRedirect([FromQuery] string target)
    {
        if (string.IsNullOrWhiteSpace(target))
            return BadRequest("Thiếu đường dẫn đích");

        return Redirect(target);
    }

    /// <summary>
    /// Trang HTML nhận #id_token từ Google OAuth 2.0, đồng bộ với Backend và bắn Deep Link về Expo Go
    /// </summary>
    [HttpGet("google-callback")]
    public ContentResult GoogleMobileCallback()
    {
        const string html = @"<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'/>
  <meta name='viewport' content='width=device-width, initial-scale=1'/>
  <title>Đăng nhập VietGuide</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; background: #f8fafc; color: #0f172a; text-align: center; padding: 24px; margin: 0; }
    .card { background: #fff; padding: 28px 24px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); max-width: 360px; width: 100%; border: 1px solid #e2e8f0; }
    .btn { display: inline-block; margin-top: 18px; padding: 14px 24px; background: #059669; color: #fff; text-decoration: none; border-radius: 14px; font-weight: bold; font-size: 15px; width: 85%; }
    .sub { font-size: 13px; color: #64748b; margin-top: 8px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class='card'>
    <h3 id='statusMsg' style='margin: 0;'>Đang xác thực tài khoản Google...</h3>
    <p id='subMsg' class='sub'>Vui lòng đợi trong giây lát...</p>
    <a id='fallbackBtn' class='btn' style='display:none;' href='#'>Mở lại ứng dụng VietGuide</a>
  </div>
  <script>
    (async function() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const idToken = params.get('id_token');
      const rawState = params.get('state') || '';

      const sepIndex = rawState.indexOf('|');
      const sessionId = sepIndex !== -1 ? rawState.substring(0, sepIndex) : rawState;
      const appReturnUrl = sepIndex !== -1 ? rawState.substring(sepIndex + 1) : '';

      if (!idToken || !sessionId) {
        document.getElementById('statusMsg').innerText = 'Không tìm thấy dữ liệu xác thực';
        document.getElementById('subMsg').innerText = 'Vui lòng đóng cửa sổ này và thử lại.';
        return;
      }

      try {
        // 1. Gửi trực tiếp id_token về Backend để lưu User vào CSDL ngay lập tức
        const res = await fetch('/api/Auth/google-mobile-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionId, idToken: idToken })
        });

        if (!res.ok) throw new Error('Backend từ chối xác thực');
        const user = await res.json();

        document.getElementById('statusMsg').innerText = '✅ Xin chào, ' + (user.fullname || user.email) + '!';
        document.getElementById('subMsg').innerText = 'Đã đồng bộ thành công! Bấm nút bên dưới (hoặc dấu ✕ ở góc trên trái) để vào ứng dụng.';

        if (appReturnUrl) {
          const joiner = appReturnUrl.includes('?') ? '&' : '?';
          const targetDeepLink = appReturnUrl + joiner + 'sessionId=' + encodeURIComponent(sessionId);

          const btn = document.getElementById('fallbackBtn');
          btn.href = targetDeepLink;
          btn.style.display = 'inline-block';

          // 2. Gọi HTTP 302 Redirect để Android tự động đóng trình duyệt mở Expo Go
          window.location.replace('/api/Auth/google-redirect?target=' + encodeURIComponent(targetDeepLink));
        }
      } catch (e) {
        document.getElementById('statusMsg').innerText = 'Xác thực thất bại';
        document.getElementById('subMsg').innerText = e.message;
      }
    })();
  </script>
</body>
</html>";
        return Content(html, "text/html");
    }
}