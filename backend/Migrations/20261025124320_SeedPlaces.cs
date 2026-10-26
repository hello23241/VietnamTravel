using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TravelGuide.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedPlaces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "IconUrl", "Name" },
                values: new object[,]
                {
                    { 1, "landscape", "Danh lam thắng cảnh" },
                    { 2, "food", "Ẩm thực & Đặc sản" },
                    { 3, "monument", "Di tích lịch sử" },
                    { 4, "camera", "Điểm Check-in / Cà phê" }
                });

            migrationBuilder.InsertData(
                table: "Provinces",
                columns: new[] { "Id", "BannerUrl", "Name", "Region" },
                values: new object[,]
                {
                    { 1, "https://example.com/danang.jpg", "Đà Nẵng", "Trung" },
                    { 2, "https://example.com/hanoi.jpg", "Hà Nội", "Bắc" },
                    { 3, "https://example.com/hcm.jpg", "TP. Hồ Chí Minh", "Nam" },
                    { 4, "https://example.com/dalat.jpg", "Lâm Đồng", "Tây Nguyên" }
                });

            migrationBuilder.InsertData(
                table: "Places",
                columns: new[] { "Id", "Address", "BookingUrl", "CategoryId", "Description", "ImageUrl", "Latitude", "Longitude", "Name", "ProvinceId", "RatingAvg", "TicketPriceAvg" },
                values: new object[,]
                {
                    { 1, "Xã Hòa Ninh, Huyện Hòa Vang, TP. Đà Nẵng", "https://klook.com/banahills", 1, "Khu du lịch trên đỉnh núi Chúa với Cầu Vàng nổi tiếng thế giới.", "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647", 15.998799999999999, 107.99590000000001, "Bà Nà Hills", 1, 4.8f, 900000.0 },
                    { 2, "Quận Hoàn Kiếm, TP. Hà Nội", null, 3, "Trái tim của thủ đô Hà Nội, gắn liền với truyền thuyết vua Lê Lợi trả gươm báu.", "https://images.unsplash.com/photo-1509042239860-f550ce710b93", 21.028700000000001, 105.8523, "Hồ Hoàn Kiếm và Đền Ngọc Sơn", 2, 4.7f, 30000.0 },
                    { 3, "Phường Bến Thành, Quận 1, TP. Hồ Chí Minh", null, 2, "Biểu tượng giao thương lâu đời với khu ẩm thực đêm sầm uất.", "https://images.unsplash.com/photo-1583417319070-4a69db38a482", 10.772500000000001, 106.69799999999999, "Chợ Bến Thành", 3, 4.5f, 0.0 },
                    { 4, "Đường Trần Quốc Toản, Phường 10, TP. Đà Lạt", null, 4, "Công trình kiến trúc nụ hoa Atiso và hoa Dã Quỳ khổng lồ bên hồ Xuân Hương.", "https://images.unsplash.com/photo-1544644181-1484b3fdfc62", 11.9366, 108.4449, "Quảng trường Lâm Viên", 4, 4.6f, 0.0 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Provinces",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Provinces",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Provinces",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Provinces",
                keyColumn: "Id",
                keyValue: 4);
        }
    }
}
