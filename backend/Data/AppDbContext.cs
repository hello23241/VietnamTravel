using Microsoft.EntityFrameworkCore;
using TravelGuide.Api.Models;

namespace TravelGuide.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Province> Provinces => Set<Province>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Place> Places => Set<Place>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Favorite> Favorites => Set<Favorite>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Khóa chính tổ hợp cho bảng trung gian Favorite
        modelBuilder.Entity<Favorite>()
            .HasKey(f => new { f.UserId, f.PlaceId });

        modelBuilder.Entity<Favorite>()
            .HasOne(f => f.User)
            .WithMany(u => u.Favorites)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Favorite>()
            .HasOne(f => f.Place)
            .WithMany(p => p.Favorites)
            .HasForeignKey(f => f.PlaceId)
            .OnDelete(DeleteBehavior.Cascade);

        // Ràng buộc xóa Place sẽ xóa luôn các Review liên quan
        modelBuilder.Entity<Review>()
            .HasOne(r => r.Place)
            .WithMany(p => p.Reviews)
            .HasForeignKey(r => r.PlaceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.User)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Tên đăng nhập không được trùng lặp
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // Chuyển decimal sang double để SQLite hỗ trợ OrderBy theo giá mà không báo lỗi
        modelBuilder.Entity<Place>()
            .Property(p => p.TicketPriceAvg)
            .HasConversion<double>();
            // Bổ sung dữ liệu mẫu cho Tỉnh thành và Danh mục
        modelBuilder.Entity<Province>().HasData(
            new Province { Id = 1, Name = "Đà Nẵng", Region = "Trung", BannerUrl = "https://example.com/danang.jpg" },
            new Province { Id = 2, Name = "Hà Nội", Region = "Bắc", BannerUrl = "https://example.com/hanoi.jpg" },
            new Province { Id = 3, Name = "TP. Hồ Chí Minh", Region = "Nam", BannerUrl = "https://example.com/hcm.jpg" },
            new Province { Id = 4, Name = "Lâm Đồng", Region = "Tây Nguyên", BannerUrl = "https://example.com/dalat.jpg" }
        );

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Danh lam thắng cảnh", IconUrl = "landscape" },
            new Category { Id = 2, Name = "Ẩm thực & Đặc sản", IconUrl = "food" },
            new Category { Id = 3, Name = "Di tích lịch sử", IconUrl = "monument" },
            new Category { Id = 4, Name = "Điểm Check-in / Cà phê", IconUrl = "camera" }
        );
        modelBuilder.Entity<Place>().HasData(
            new Place
            {
                Id = 1,
                ProvinceId = 1, // Đà Nẵng
                CategoryId = 1, // Danh lam thắng cảnh
                Name = "Bà Nà Hills",
                Description = "Khu du lịch trên đỉnh núi Chúa với Cầu Vàng nổi tiếng thế giới.",
                Address = "Xã Hòa Ninh, Huyện Hòa Vang, TP. Đà Nẵng",
                ImageUrl = "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647",
                Latitude = 15.9988,
                Longitude = 107.9959,
                TicketPriceAvg = 900000m,
                BookingUrl = "https://klook.com/banahills",
                RatingAvg = 4.8f
            },
            new Place
            {
                Id = 2,
                ProvinceId = 2, // Hà Nội
                CategoryId = 3, // Di tích lịch sử
                Name = "Hồ Hoàn Kiếm và Đền Ngọc Sơn",
                Description = "Trái tim của thủ đô Hà Nội, gắn liền với truyền thuyết vua Lê Lợi trả gươm báu.",
                Address = "Quận Hoàn Kiếm, TP. Hà Nội",
                ImageUrl = "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
                Latitude = 21.0287,
                Longitude = 105.8523,
                TicketPriceAvg = 30000m,
                BookingUrl = null,
                RatingAvg = 4.7f
            },
            new Place
            {
                Id = 3,
                ProvinceId = 3, // TP. Hồ Chí Minh
                CategoryId = 2, // Ẩm thực & Đặc sản
                Name = "Chợ Bến Thành",
                Description = "Biểu tượng giao thương lâu đời với khu ẩm thực đêm sầm uất.",
                Address = "Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
                ImageUrl = "https://images.unsplash.com/photo-1583417319070-4a69db38a482",
                Latitude = 10.7725,
                Longitude = 106.6980,
                TicketPriceAvg = 0m,
                BookingUrl = null,
                RatingAvg = 4.5f
            },
            new Place
            {
                Id = 4,
                ProvinceId = 4, // Lâm Đồng
                CategoryId = 4, // Điểm Check-in
                Name = "Quảng trường Lâm Viên",
                Description = "Công trình kiến trúc nụ hoa Atiso và hoa Dã Quỳ khổng lồ bên hồ Xuân Hương.",
                Address = "Đường Trần Quốc Toản, Phường 10, TP. Đà Lạt",
                ImageUrl = "https://images.unsplash.com/photo-1544644181-1484b3fdfc62",
                Latitude = 11.9366,
                Longitude = 108.4449,
                TicketPriceAvg = 0m,
                BookingUrl = null,
                RatingAvg = 4.6f
            }
        );
    }
}