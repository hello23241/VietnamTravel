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
/// Nhận #id_token từ Google OAuth 2.0 và ép trình duyệt gọi Deep Link mở lại Mobile App
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
.btn { margin-top: 16px; padding: 12px 24px; background: #059669; color: #fff; text-decoration: none; border-radius: 12px; font-weight: bold; }
</style>
<script>
document.addEventListener('DOMContentLoaded', function() {
  // 1. Lấy thông tin từ URL băm (hash)
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const idToken = params.get('id_token');
  const state = params.get('state'); // Chứa exp://192.168...
  
  if (idToken && state) {
    // 2. Tạo Deep Link an toàn
    const sep = state.includes('?') ? '&' : '?';
    const deepLinkUrl = state + sep + 'id_token=' + encodeURIComponent(idToken);
    
    // 3. Gắn link vào nút bấm dự phòng
    const btn = document.getElementById('fallbackBtn');
    btn.href = deepLinkUrl;
    
    // 4. Ép trình duyệt mở thẳng Deep Link ngay lập tức
    window.location.href = deepLinkUrl;
  } else {
    document.getElementById('statusMsg').innerText = 'Lỗi: Không nhận được dữ liệu xác thực từ Google.';
    document.getElementById('fallbackBtn').style.display = 'none';
  }
});
</script>
</head>
<body>
<h3 id='statusMsg'>Đang đồng bộ tài khoản Google về VietGuide...</h3>
<p style='font-size: 13px; color: #64748b; margin-top: 8px; margin-bottom: 24px;'>Nếu ứng dụng không tự động mở lại, vui lòng bấm nút bên dưới.</p>
<a id='fallbackBtn' class='btn' href='#'>Quay lại ứng dụng</a>
</body>
</html>";
    return Content(html, "text/html");
}

    [HttpPost("register")]
    public async Task<ActionResult<UserResponseDto>> Register([FromBody] RegisterRequestDto dto)
    {
        var rawInput = dto.Username.Trim().ToLower();
        var email = rawInput.Contains('@') ? rawInput : $"{rawInput}@gmail.com";

        var exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
        if (exists)
        {
            return BadRequest(new { message = "Tài khoản hoặc Email này đã được sử dụng" });
        }

        var role = IsDntuAdminEmail(email) ? "Admin" : "User";
        var user = new User
        {
            Email = email,
            Fullname = dto.Fullname.Trim(),
            AvatarUrl = string.IsNullOrWhiteSpace(dto.AvatarUrl)
                ? "https://ui-avatars.com/api/?name=" + Uri.EscapeDataString(dto.Fullname.Trim())
                : dto.AvatarUrl.Trim(),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new UserResponseDto
        {
            Id = user.Id,
            Email = user.Email,
            Fullname = user.Fullname,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        var input = dto.Username.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Email.ToLower() == input ||
            u.Email.ToLower() == $"{input}@gmail.com" ||
            (input == "kietho" && u.Email.ToLower() == "nhankiet1705@gmail.com"));

        if (user == null)
        {
            return Unauthorized(new { message = "Tài khoản không tồn tại trong hệ thống" });
        }

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
}