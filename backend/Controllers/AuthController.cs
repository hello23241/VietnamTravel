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

    /// <summary>
    /// Đăng ký tài khoản thành viên mới.
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<UserResponseDto>> Register([FromBody] RegisterRequestDto dto)
    {
        // 1. Kiểm tra username đã tồn tại trong CSDL chưa
        var isUsernameTaken = await _context.Users.AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower());
        if (isUsernameTaken)
        {
            return BadRequest(new { message = "Tên đăng nhập này đã được sử dụng" });
        }

        // 2. Băm mật khẩu bằng BCrypt
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        // 3. Tạo Entity mới
        var user = new User
        {
            Username = dto.Username.Trim(),
            PasswordHash = passwordHash,
            Fullname = dto.Fullname.Trim(),
            AvatarUrl = string.IsNullOrWhiteSpace(dto.AvatarUrl) 
                ? "https://ui-avatars.com/api/?name=" + Uri.EscapeDataString(dto.Fullname) 
                : dto.AvatarUrl,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // 4. Trả về DTO an toàn (HTTP 201)
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

    /// <summary>
    /// Xác thực đăng nhập tài khoản.
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<UserResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        // 1. Tìm user theo username
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == dto.Username.ToLower());
        if (user == null)
        {
            return BadRequest(new { message = "Tên đăng nhập hoặc mật khẩu không chính xác" });
        }

        // 2. So khớp chuỗi mật khẩu nhập vào với mã băm trong DB
        var isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            return BadRequest(new { message = "Tên đăng nhập hoặc mật khẩu không chính xác" });
        }

        // 3. Trả về thông tin người dùng đăng nhập thành công
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