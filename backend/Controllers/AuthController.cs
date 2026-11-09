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