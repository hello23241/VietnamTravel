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

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserResponseDto>> Register([FromBody] RegisterRequestDto dto)
    {
        var usernameTrimmed = dto.Username.Trim();
        var isUsernameTaken = await _context.Users.AnyAsync(u => u.Username.ToLower() == usernameTrimmed.ToLower());
        if (isUsernameTaken)
        {
            return BadRequest(new { message = "Tên đăng nhập này đã được sử dụng" });
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        var user = new User
        {
            Username = usernameTrimmed,
            PasswordHash = passwordHash,
            Fullname = dto.Fullname.Trim(),
            AvatarUrl = string.IsNullOrWhiteSpace(dto.AvatarUrl)
                ? "https://ui-avatars.com/api/?name=" + Uri.EscapeDataString(dto.Fullname.Trim())
                : dto.AvatarUrl.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var responseDto = new UserResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Fullname = user.Fullname,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt
        };

        return StatusCode(StatusCodes.Status201Created, responseDto);
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        var usernameTrimmed = dto.Username.Trim();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == usernameTrimmed.ToLower());
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không chính xác" });
        }

        return Ok(new UserResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Fullname = user.Fullname,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt
        });
    }
}