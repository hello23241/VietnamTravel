using TravelGuide.Api.Models;

namespace TravelGuide.Api.Data;

public static class DbInitializer
{
    public static void SeedUsersAndReviews(AppDbContext context)
    {
        // 1. Seed tài khoản Admin và User mẫu nếu chưa có
        if (!context.Users.Any())
        {
            var adminUser = new User
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Fullname = "Quản trị viên Hệ thống",
                AvatarUrl = "https://ui-avatars.com/api/?name=Admin+VietGuide",
                CreatedAt = DateTime.UtcNow
            };

            var normalUser = new User
            {
                Username = "kietho",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Fullname = "Hồ Nhân Kiệt",
                AvatarUrl = "https://ui-avatars.com/api/?name=Kiet+Ho",
                CreatedAt = DateTime.UtcNow
            };

            context.Users.AddRange(adminUser, normalUser);
            context.SaveChanges();
        }

        // 2. Seed đánh giá mẫu để AdminPage có dữ liệu kiểm duyệt ngay lập tức
        if (!context.Reviews.Any())
        {
            var kiet = context.Users.FirstOrDefault(u => u.Username == "kietho");
            var place = context.Places.FirstOrDefault(p => p.Id == 1); // Bà Nà Hills

            if (kiet != null && place != null)
            {
                context.Reviews.AddRange(
                    new Review
                    {
                        UserId = kiet.Id,
                        PlaceId = place.Id,
                        Rating = 5,
                        Comment = "Cầu Vàng Bà Nà Hills cảnh sắc tuyệt đẹp, dịch vụ cáp treo rất chuyên nghiệp!",
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    },
                    new Review
                    {
                        UserId = kiet.Id,
                        PlaceId = place.Id,
                        Rating = 1,
                        Comment = "Nội dung quảng cáo spam dịch vụ tour ngoài luồng không chính thống...",
                        CreatedAt = DateTime.UtcNow.AddHours(-3)
                    }
                );
                context.SaveChanges();
            }
        }
    }
}