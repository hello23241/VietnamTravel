using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TravelGuide.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    IconUrl = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Provinces",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Region = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    BannerUrl = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Provinces", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Fullname = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    AvatarUrl = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    Role = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Places",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProvinceId = table.Column<int>(type: "INTEGER", nullable: false),
                    CategoryId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Address = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    ImageUrl = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Latitude = table.Column<double>(type: "REAL", nullable: false),
                    Longitude = table.Column<double>(type: "REAL", nullable: false),
                    TicketPriceAvg = table.Column<double>(type: "decimal(12,2)", nullable: false),
                    BookingUrl = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    RatingAvg = table.Column<float>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Places", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Places_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Places_Provinces_ProvinceId",
                        column: x => x.ProvinceId,
                        principalTable: "Provinces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Favorites",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    PlaceId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favorites", x => new { x.UserId, x.PlaceId });
                    table.ForeignKey(
                        name: "FK_Favorites_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Favorites_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    PlaceId = table.Column<int>(type: "INTEGER", nullable: false),
                    Rating = table.Column<int>(type: "INTEGER", nullable: false),
                    Comment = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reviews_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                    { 4, "https://example.com/dalat.jpg", "Lâm Đồng", "Trung" }
                });

            migrationBuilder.InsertData(
                table: "Places",
                columns: new[] { "Id", "Address", "BookingUrl", "CategoryId", "Description", "ImageUrl", "Latitude", "Longitude", "Name", "ProvinceId", "RatingAvg", "TicketPriceAvg" },
                values: new object[,]
                {
                    { 1, "Xã Hòa Ninh, Huyện Hòa Vang, TP. Đà Nẵng", "https://klook.com/banahills", 1, "Khu du lịch trên đỉnh núi Chúa với Cầu Vàng nổi tiếng thế giới.", "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647", 15.998799999999999, 107.99590000000001, "Bà Nà Hills", 1, 4.8f, 900000.0 },
                    { 2, "Quận Hoàn Kiếm, TP. Hà Nội", null, 3, "Trái tim của thủ đô Hà Nội, gắn liền với truyền thuyết vua Lê Lợi trả gươm báu.", "ho-hoan-kiem.jpg", 21.028700000000001, 105.8523, "Hồ Hoàn Kiếm và Đền Ngọc Sơn", 2, 4.7f, 30000.0 },
                    { 3, "Phường Bến Thành, Quận 1, TP. Hồ Chí Minh", null, 2, "Biểu tượng giao thương lâu đời với khu ẩm thực đêm sầm uất.", "cho-ben-thanh.jpg", 10.772500000000001, 106.69799999999999, "Chợ Bến Thành", 3, 4.5f, 0.0 },
                    { 4, "Đường Trần Quốc Toản, Phường 10, TP. Đà Lạt", null, 4, "Công trình kiến trúc nụ hoa Atiso và hoa Dã Quỳ khổng lồ bên hồ Xuân Hương.", "quang-truong-lam-vien.webp", 11.9366, 108.4449, "Quảng trường Lâm Viên", 4, 4.6f, 0.0 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_PlaceId",
                table: "Favorites",
                column: "PlaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Places_CategoryId",
                table: "Places",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Places_ProvinceId",
                table: "Places",
                column: "ProvinceId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_PlaceId",
                table: "Reviews",
                column: "PlaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_UserId",
                table: "Reviews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Favorites");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "Places");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "Provinces");
        }
    }
}
