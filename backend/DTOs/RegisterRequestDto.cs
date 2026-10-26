using System.ComponentModel.DataAnnotations;

namespace TravelGuide.Api.DTOs;

public class RegisterRequestDto
{
    [Required(ErrorMessage = "Tên đăng nhập không được để trống")]
    [MinLength(4, ErrorMessage = "Tên đăng nhập phải có ít nhất 4 ký tự")]
    [MaxLength(50, ErrorMessage = "Tên đăng nhập tối đa 50 ký tự")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được để trống")]
    [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Họ và tên không được để trống")]
    [MaxLength(100, ErrorMessage = "Họ và tên tối đa 100 ký tự")]
    public string Fullname { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? AvatarUrl { get; set; }
}