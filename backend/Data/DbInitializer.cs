using TravelGuide.Api.Models;

namespace TravelGuide.Api.Data;

public static class DbInitializer
{
    public static void SeedUsersAndReviews(AppDbContext context)
    {
        // 1. ĐỒNG BỘ VÙNG MIỀN
        var tayNguyenProvinces = context.Provinces.Where(p => p.Region == "Tây Nguyên").ToList();
        if (tayNguyenProvinces.Count > 0)
        {
            foreach (var prov in tayNguyenProvinces)
            {
                prov.Region = "Trung";
            }
            context.SaveChanges();
        }

        // 2. SEED TÀI KHOẢN ADMIN VÀ USER
        if (!context.Users.Any(u => u.Username.ToLower() == "admin"))
        {
            context.Users.Add(new User
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Fullname = "Quản trị viên Hệ thống",
                AvatarUrl = "https://ui-avatars.com/api/?name=Admin+VietGuide",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!context.Users.Any(u => u.Username.ToLower() == "kietho"))
        {
            context.Users.Add(new User
            {
                Username = "kietho",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Fullname = "Hồ Nhân Kiệt",
                AvatarUrl = "https://ui-avatars.com/api/?name=Kiet+Ho",
                CreatedAt = DateTime.UtcNow
            });
        }
        context.SaveChanges();

        // 3. SEED THÊM TỈNH THÀNH (Nếu chưa có)
        var requiredProvinces = new List<Province>
        {
            new Province { Name = "Quảng Ninh", Region = "Bắc" },
            new Province { Name = "Lào Cai", Region = "Bắc" },
            new Province { Name = "Ninh Bình", Region = "Bắc" },
            new Province { Name = "Hà Giang", Region = "Bắc" },
            new Province { Name = "Thừa Thiên Huế", Region = "Trung" },
            new Province { Name = "Quảng Nam", Region = "Trung" },
            new Province { Name = "Khánh Hòa", Region = "Trung" },
            new Province { Name = "Bình Thuận", Region = "Trung" },
            new Province { Name = "Kiên Giang", Region = "Nam" },
            new Province { Name = "Tây Ninh", Region = "Nam" },
            new Province { Name = "Bà Rịa - Vũng Tàu", Region = "Nam" }
        };

        foreach (var prov in requiredProvinces)
        {
            if (!context.Provinces.Any(p => p.Name == prov.Name))
            {
                context.Provinces.Add(new Province { Name = prov.Name, Region = prov.Region });
            }
        }
        context.SaveChanges();

        // 4. SEED 20 ĐỊA ĐIỂM DU LỊCH THẬT (Bao gồm 4 địa điểm gốc ở ID 1->4)
        if (context.Places.Count() <= 4)
        {
            var places = new List<Place>
            {
                // -- MIỀN BẮC --
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Quảng Ninh").Id,
                    CategoryId = 1, Name = "Vịnh Hạ Long",
                    Description = "Di sản thiên nhiên thế giới UNESCO với hàng nghìn hòn đảo đá vôi kỳ vĩ vươn lên từ mặt nước xanh ngọc.",
                    Address = "Thành phố Hạ Long, Quảng Ninh",
                    ImageUrl = "vinh-ha-long.webp",
                    Latitude = 20.9101, Longitude = 107.1839, TicketPriceAvg = 290000m, RatingAvg = 4.9f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Lào Cai").Id,
                    CategoryId = 1, Name = "Đỉnh Fansipan",
                    Description = "Nóc nhà Đông Dương ở độ cao 3.143m. Trải nghiệm hệ thống cáp treo kỷ lục và ngắm biển mây bồng bềnh tuyệt đẹp.",
                    Address = "Thị xã Sa Pa, Tỉnh Lào Cai",
                    ImageUrl = "dinh-fansipan.jpg",
                    Latitude = 22.3073, Longitude = 103.7705, TicketPriceAvg = 800000m, BookingUrl = "https://fansipanlegend.sunworld.vn/", RatingAvg = 4.8f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Ninh Bình").Id,
                    CategoryId = 1, Name = "Quần thể danh thắng Tràng An",
                    Description = "Sự hòa quyện tuyệt đẹp giữa những ngọn núi đá vôi vươn cao, hang động huyền bí và những dòng sông tĩnh lặng uốn lượn.",
                    Address = "Hoa Lư, Ninh Bình",
                    ImageUrl = "trang-an.jpg",
                    Latitude = 20.2641, Longitude = 105.9189, TicketPriceAvg = 250000m, RatingAvg = 4.7f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Ninh Bình").Id,
                    CategoryId = 3, Name = "Hang Múa",
                    Description = "Điểm check-in toàn cảnh Tam Cốc tuyệt đẹp sau khi chinh phục 486 bậc thang đá mô phỏng Vạn Lý Trường Thành.",
                    Address = "Xã Ninh Xuân, Hoa Lư, Ninh Bình",
                    ImageUrl = "hang-mua-ninh-binh.jpg",
                    Latitude = 20.2185, Longitude = 105.9174, TicketPriceAvg = 100000m, RatingAvg = 4.6f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Hà Giang").Id,
                    CategoryId = 1, Name = "Đèo Mã Pí Lèng",
                    Description = "Một trong 'tứ đại đỉnh đèo' của Việt Nam, mang vẻ đẹp ngoạn mục với những vách đá dựng đứng và dòng sông Nho Quế xanh biếc dưới vực sâu.",
                    Address = "Huyện Mèo Vạc, Tỉnh Hà Giang",
                    ImageUrl = "deo-ma-pi-leng.jpg",
                    Latitude = 23.2384, Longitude = 105.4290, TicketPriceAvg = 0m, RatingAvg = 4.9f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Hà Nội").Id,
                    CategoryId = 2, Name = "Phố Ẩm Thực Tống Duy Tân",
                    Description = "Con phố ẩm thực mở xuyên đêm nổi tiếng tại thủ đô với gà tần, phở, bún miến đa dạng mang đậm hương vị Hà Thành.",
                    Address = "Phố Tống Duy Tân, Hàng Bông, Hoàn Kiếm, Hà Nội",
                    ImageUrl = "pho-tong-duy-tan.jpg",
                    Latitude = 21.0298, Longitude = 105.8433, TicketPriceAvg = 0m, RatingAvg = 4.3f
                },

                // -- MIỀN TRUNG & TÂY NGUYÊN --
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Thừa Thiên Huế").Id,
                    CategoryId = 3, Name = "Kinh Thành Huế (Đại Nội)",
                    Description = "Công trình kiến trúc cung đình triều Nguyễn đồ sộ với các cung điện vàng son, đền đài nguy nga mang đậm dấu ấn lịch sử.",
                    Address = "Đường 23/8, Phường Thuận Hòa, TP. Huế",
                    ImageUrl = "dai-noi-hue.webp",
                    Latitude = 16.4674, Longitude = 107.5753, TicketPriceAvg = 200000m, RatingAvg = 4.7f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Quảng Nam").Id,
                    CategoryId = 3, Name = "Phố cổ Hội An",
                    Description = "Thương cảng xưa tĩnh lặng với những ngôi nhà cổ tường vàng mái ngói rêu phong, lung linh ánh lồng đèn về đêm.",
                    Address = "Phường Minh An, TP. Hội An, Quảng Nam",
                    ImageUrl = "hoi-an-quang-nam.jpg",
                    Latitude = 15.8795, Longitude = 108.3283, TicketPriceAvg = 120000m, RatingAvg = 4.8f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Khánh Hòa").Id,
                    CategoryId = 1, Name = "VinWonders Nha Trang",
                    Description = "Công viên giải trí của những kỷ lục trên đảo Hòn Tre. Hệ sinh thái trò chơi cảm giác mạnh, công viên nước và show diễn hoành tráng.",
                    Address = "Đảo Hòn Tre, Phường Vĩnh Nguyên, TP. Nha Trang",
                    ImageUrl = "vinwonders.jpg",
                    Latitude = 12.2173, Longitude = 109.2458, TicketPriceAvg = 950000m, BookingUrl = "https://vinwonders.com/nha-trang/", RatingAvg = 4.8f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Bình Thuận").Id,
                    CategoryId = 4, Name = "Đồi Cát Bay Mũi Né",
                    Description = "Tiểu sa mạc thay đổi hình dáng theo giờ. Khám phá vẻ đẹp cồn cát đỏ rực và trải nghiệm trò chơi trượt cát thú vị.",
                    Address = "Khu phố 5, Phường Mũi Né, TP. Phan Thiết",
                    ImageUrl = "doi-cat-bay-mui-ne.jpg",
                    Latitude = 10.9577, Longitude = 108.2917, TicketPriceAvg = 15000m, RatingAvg = 4.2f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Lâm Đồng").Id,
                    CategoryId = 1, Name = "Khu du lịch Thác Datanla",
                    Description = "Hệ thống thác nước hoang sơ hùng vĩ kết hợp máng trượt alpine coaster dài nhất Đông Nam Á băng qua rừng thông xanh.",
                    Address = "QL20 Đèo Prenn, Phường 3, TP. Đà Lạt",
                    ImageUrl = "thac-datanla.jpg",
                    Latitude = 11.9022, Longitude = 108.4497, TicketPriceAvg = 50000m, RatingAvg = 4.5f
                },

                // -- MIỀN NAM --
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Kiên Giang").Id,
                    CategoryId = 1, Name = "Grand World Phú Quốc",
                    Description = "Thành phố không ngủ lấy cảm hứng từ Venice (Ý) với dòng kênh đào lãng mạn, các dãy phố shophouse rực rỡ và show sắc màu Venice.",
                    Address = "Gành Dầu, Đảo Phú Quốc, Tỉnh Kiên Giang",
                    ImageUrl = "grand-world-phu-quoc.jpg",
                    Latitude = 10.3346, Longitude = 103.8550, TicketPriceAvg = 0m, RatingAvg = 4.6f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Kiên Giang").Id,
                    CategoryId = 1, Name = "Bãi Sao",
                    Description = "Bãi biển đẹp nhất Phú Quốc với dải cát trắng mịn như kem cong cong hình lưỡi liềm bên làn nước trong xanh êm đềm.",
                    Address = "Thị trấn An Thới, TP. Phú Quốc, Kiên Giang",
                    ImageUrl = "bai-sao.jpg",
                    Latitude = 10.0543, Longitude = 104.0353, TicketPriceAvg = 0m, RatingAvg = 4.7f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Tây Ninh").Id,
                    CategoryId = 3, Name = "Khu Du Lịch Núi Bà Đen",
                    Description = "Nóc nhà Đông Nam Bộ linh thiêng với hệ thống chùa cổ kính và tượng Phật Bà Tây Bổ Đà Sơn đúc bằng đồng cao nhất Châu Á.",
                    Address = "Thạnh Tân, TP. Tây Ninh",
                    ImageUrl = "nui-ba-den.jpg",
                    Latitude = 11.3745, Longitude = 106.1703, TicketPriceAvg = 400000m, BookingUrl = "https://badenmountain.sunworld.vn/", RatingAvg = 4.8f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "Bà Rịa - Vũng Tàu").Id,
                    CategoryId = 3, Name = "Tượng Chúa Dang Tay",
                    Description = "Công trình tôn giáo biểu tượng của Vũng Tàu trên đỉnh Núi Nhỏ. Du khách leo 1000 bậc thang để ngắm toàn cảnh thành phố biển.",
                    Address = "Thùy Vân, Phường 2, TP. Vũng Tàu",
                    ImageUrl = "tuong-chua-dang-tay.jpg",
                    Latitude = 10.3275, Longitude = 107.0858, TicketPriceAvg = 0m, RatingAvg = 4.5f
                },
                new Place {
                    ProvinceId = context.Provinces.First(p => p.Name == "TP. Hồ Chí Minh").Id,
                    CategoryId = 3, Name = "Dinh Độc Lập",
                    Description = "Di tích lịch sử cấp quốc gia đặc biệt, nơi đánh dấu sự kiện thống nhất đất nước ngày 30/4/1975, sở hữu kiến trúc cổ kính độc đáo.",
                    Address = "135 Nam Kỳ Khởi Nghĩa, Phường Bến Thành, Quận 1, TP. HCM",
                    ImageUrl = "dinh-doc-lap.jpg",
                    Latitude = 10.7769, Longitude = 106.6953, TicketPriceAvg = 65000m, RatingAvg = 4.6f
                }
            };
            
            context.Places.AddRange(places);
            context.SaveChanges();
        }

        // 5. SEED ĐÁNH GIÁ MẪU
        if (!context.Reviews.Any())
        {
            var kiet = context.Users.FirstOrDefault(u => u.Username == "kietho");
            var place = context.Places.FirstOrDefault(p => p.Id == 1);

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
                place.RatingAvg = 3.0f;
                context.SaveChanges();
            }
        }
    }
}