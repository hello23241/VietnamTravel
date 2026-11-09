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

    /// <summary>
    /// Đăng nhập / Đăng ký tự động thông qua Google ID Token.
    /// </summary>
    [HttpPost("google")]
    public async Task<ActionResult<UserResponseDto>> GoogleLogin([FromBody] GoogleLoginRequestDto dto)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            // 1. Xác thực ID Token trực tiếp với máy chủ Google
            var validationSettings = new GoogleJsonWebSignature.ValidationSettings
            {
                // Nếu muốn kiểm tra chặt chẽ Client ID thì cấu hình, hoặc để trống nếu dùng đa nền tảng Web + Mobile
                Audience = !string.IsNullOrWhiteSpace(_configuration["GoogleAuth:ClientId"]) 
                    ? new[] { _configuration["GoogleAuth:ClientId"] } 
                    : null
            };

            payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, validationSettings);
        }
        catch (InvalidJwtException ex)
        {
            return Unauthorized(new { message = "Xác thực Google thất bại hoặc Token đã hết hạn", details = ex.Message });
        }

        var email = payload.Email.ToLower().Trim();

        var isAdminDomain = email.EndsWith("@dntu.edu.vn", StringComparison.OrdinalIgnoreCase);
        var role = isAdminDomain ? "Admin" : "User";

        // 3. Tìm user trong cơ sở dữ liệu theo email
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            // Người dùng mới đăng nhập lần đầu -> Tự động tạo tài khoản
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
            // Người dùng cũ -> Cập nhật thông tin mới nhất từ Google và đồng bộ Role
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
}