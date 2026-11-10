# 🌏 VietGuide — Hệ Thống Cẩm Nang Du Lịch Việt Nam (Vietnam Travel Guide)

Hệ thống cẩm nang du lịch đa nền tảng giúp tra cứu địa điểm tham quan khắp 3 miền Bắc – Trung – Nam, theo dõi thời tiết thời gian thực qua GPS, lập kế hoạch ngân sách chuyến đi (Sổ tay yêu thích) và quản lý đánh giá cộng đồng. Dự án được tổ chức theo kiến trúc **Monorepo** gồm 3 phân hệ: **Backend RESTful API (.NET 8)**, **Web Client & Admin Portal (React + Vite)** và **Mobile App (React Native + Expo)**.

---

## 🛠 Công Nghệ & Kiến Trúc Hệ Thống

| Phân hệ | Công nghệ sử dụng | Mô tả chi tiết |
| :--- | :--- | :--- |
| **Backend (`/backend`)** | ASP.NET Core Web API (.NET 8), Entity Framework Core 8, SQLite | Cung cấp RESTful API, tự động khởi tạo & nạp dữ liệu mẫu (`travel_vietnam.db` với 15 tỉnh thành và 20 địa danh), tích hợp `Google.Apis.Auth` xác thực OAuth 2.0 (Web & Mobile Deep Link), `IMemoryCache` lưu đệm thời tiết OpenWeatherMap (kèm cơ chế Fallback tự động khi thiếu key) và nội suy ảnh qua jsDelivr GitHub CDN. |
| **Web Client (`/web`)** | React 19, Vite 8, Tailwind CSS 3, React Router v7, Axios | Giao diện tra cứu điểm đến cho du khách, tích hợp đăng nhập Google OAuth (`@react-oauth/google`), đồng bộ Sổ tay yêu thích (Wishlist Drawer) tính toán tổng chi phí vé và Trung tâm Quản trị (Admin Portal) 5 phân khu có biểu đồ trực quan. |
| **Mobile App (`/mobile`)** | React Native 0.88, Expo SDK 58, React Navigation v7, Axios | Ứng dụng di động đa nền tảng (Android / iOS) tích hợp Splash Screen, đăng nhập Google OAuth 2.0 qua trình duyệt hệ thống, tra cứu địa danh theo vùng miền, xem thời tiết trực tiếp, lưu sổ tay dự toán kinh phí, dẫn đường qua Google Maps (`expo-linking`) và mở trang đặt vé trực tuyến (`expo-web-browser`). |
| **Image CDN (`/images`)** | GitHub + jsDelivr CDN | Kho lưu trữ hình ảnh địa danh gốc, được Backend tự động nối đường dẫn qua `https://cdn.jsdelivr.net/gh/hello23241/VietnamTravel@main/images/`. |

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
VietnamTravel/
├── .gitignore                                     # Bộ lọc file nhạy cảm (.env, *.db, bin, obj, node_modules)
├── README.md                                      # Tài liệu hướng dẫn cài đặt & bảo mật API Key
├── VietGuide_TravelApi.postman_collection.json    # Bộ kịch bản kiểm thử tự động Postman (33 kịch bản)
├── images/                                        # Kho ảnh địa danh phục vụ qua jsDelivr CDN
│
├── backend/                                       # Phân hệ ASP.NET Core Web API (.NET 8)
│   ├── Controllers/                               # Admin, Auth, Categories, Favorites, Places, Provinces, Reviews
│   ├── Data/                                      # AppDbContext & DbInitializer (Tự động Migrate & Seed 20 địa điểm)
│   ├── DTOs/                                      # Các lớp truyền tải dữ liệu (Data Transfer Objects)
│   ├── Middleware/                                # ErrorHandlingMiddleware (Bắt lỗi tập trung toàn cục)
│   ├── Migrations/                                # Lịch sử khởi tạo cấu trúc bảng SQLite
│   ├── Models/                                    # Category, Favorite, Place, Province, Review, User
│   ├── Properties/launchSettings.json             # Cấu hình Kestrel chạy cổng 5128 ([http://0.0.0.0:5128](http://0.0.0.0:5128))
│   ├── Services/                                  # WeatherService (Gọi OpenWeatherMap API + Cache 30 phút + Fallback)
│   ├── appsettings.json                           # Cấu hình mẫu (KHÔNG chứa key thật khi push lên Git)
│   ├── Program.cs                                 # Cấu hình DI, CORS, Swagger, Auto-Migration & Seeding
│   └── TravelGuide.Api.csproj                     # Cấu hình gói NuGet & UserSecretsId
│
├── web/                                           # Phân hệ Web Client & Admin Portal (React + Vite)
│   ├── src/
│   │   ├── api/                                   # apiClient.js & travelApi.js (Tích hợp VITE_API_URL)
│   │   ├── components/                            # Navbar.jsx
│   │   ├── context/                               # AuthContext.jsx & WishlistContext.jsx
│   │   ├── pages/                                 # HomePage.jsx, DetailPage.jsx, LoginPage.jsx, AdminPage.jsx
│   │   ├── App.jsx                                # Định tuyến React Router
│   │   └── main.jsx                               # Điểm khởi chạy bọc GoogleOAuthProvider (VITE_GOOGLE_CLIENT_ID)
│   ├── .env                                       # File biến môi trường cục bộ (Đã chặn trong .gitignore)
│   ├── package.json                               # Dependencies và Scripts Vite
│   └── vite.config.js                             # Cấu hình Dev Server cổng 5173
│
└── mobile/                                        # Phân hệ Ứng dụng Di động (React Native + Expo)
    ├── assets/                                    # Icons và Splash Screen (icon.png)
    ├── src/
    │   ├── api/                                   # apiClient.js & travelApi.js (Tích hợp EXPO_PUBLIC_API_URL)
    │   ├── navigation/                            # AppNavigator.js (Tích hợp Splash Screen)
    │   └── screens/                               # LoginScreen.js, HomeScreen.js, DetailScreen.js, FavoritesScreen.js
    ├── .env                                       # File biến môi trường cục bộ (Đã chặn trong .gitignore)
    ├── .env.example                               # File mẫu cấu hình EXPO_PUBLIC_API_URL
    ├── App.js                                     # Root Component
    ├── app.json                                   # Cấu hình Expo & Deep Link scheme "vietguide"
    └── package.json                               # Dependencies và Scripts Expo
```

---

## 📋 Yêu Cầu Cài Đặt Môi Trường

Trước khi thiết lập dự án, hãy đảm bảo máy tính của bạn đã cài đặt đầy đủ các công cụ sau:
1. **[.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0):** Kiểm tra bằng lệnh `dotnet --version`.
2. **[Node.js (LTS v18 hoặc v20+)](https://nodejs.org/):** Kiểm tra bằng lệnh `node -v` và `npm -v`.
3. **[Git](https://git-scm.com/):** Dùng để quản lý mã nguồn (Kiểm tra bằng lệnh `git --version`).
4. **Công cụ chạy Mobile App (Chọn 1 trong 2):**
   * **Máy ảo (Khuyên dùng):** Cài đặt [Android Studio](https://developer.android.com/studio) (Virtual Device Manager) hoặc Xcode Simulator (trên macOS).
   * **Máy thật:** Tải ứng dụng **Expo Go** trên Google Play Store hoặc Apple App Store.

---

## 🔐 Hướng Dẫn Lấy & Gán API Key Bảo Mật (Không Lộ Key Khi Push Git)

Dự án sử dụng **Google OAuth Client ID** (cho tính năng đăng nhập Google trên Web & Mobile) và **OpenWeatherMap API Key** (cho tính năng dự báo thời tiết thực tế tại điểm đến). Để tuyệt đối không làm lộ khóa bí mật (Secret/API Key) lên GitHub khi `git push`, hãy làm theo đúng quy trình dưới đây.

### Bước 1: Cách lấy các API Key cần thiết

* **Lấy Google OAuth Client ID:**
  1. Truy cập [Google Cloud Console](https://console.cloud.google.com/), tạo Project mới hoặc chọn Project hiện có.
  2. Vào mục **APIs & Services** -> **OAuth consent screen**, cấu hình thông tin cơ bản và thêm email thử nghiệm.
  3. Vào mục **Credentials** -> **Create Credentials** -> **OAuth client ID**, chọn loại ứng dụng là **Web application**.
  4. Tại mục **Authorized JavaScript origins**, thêm 2 địa chỉ:
     * `http://localhost:5173`
     * `http://localhost`
  5. Tại mục **Authorized redirect URIs** (phục vụ callback đăng nhập Google cho Mobile App), thêm địa chỉ:
     * `http://localhost:5128/api/Auth/google-callback`
  6. Nhấn **Create** và sao chép mã **Client ID** (có định dạng `xxxxxx.apps.googleusercontent.com`).

* **Lấy OpenWeatherMap API Key:**
  1. Đăng ký hoặc đăng nhập tài khoản tại [OpenWeatherMap](https://openweathermap.org/).
  2. Vào mục **My API keys** trong hồ sơ cá nhân để sao chép chuỗi API Key (gói Free đáp ứng hoàn toàn nhu cầu của dự án nhờ Backend đã có `IMemoryCache` lưu đệm 30 phút).
  3. *Lưu ý:* Nếu bạn chưa có hoặc không gắn key OpenWeatherMap, `WeatherService` của Backend sẽ tự động kích hoạt chế độ **Fallback thông minh** (sinh dữ liệu thời tiết giả lập theo vĩ độ Bắc/Nam) để ứng dụng luôn hoạt động mượt mà, không bao giờ bị lỗi.

### Bước 2: Gán Key vào Backend (.NET 8) bằng `dotnet user-secrets`

File `backend/appsettings.json` đang được Git theo dõi (tracked). Thay vì sửa trực tiếp vào file cấu hình, hãy dùng công cụ **Secret Manager** của .NET để lưu key an toàn bên ngoài thư mục code:

Mở Terminal tại thư mục `backend/` và chạy các lệnh sau:

```bash
cd backend

# 1. Gán Google Client ID để xác thực token từ Web và Mobile
dotnet user-secrets set "GoogleAuth:ClientId" "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"

# 2. (Tùy chọn) Gán OpenWeatherMap API Key để lấy thời tiết thời gian thực
dotnet user-secrets set "OpenWeatherMap:ApiKey" "YOUR_OPENWEATHERMAP_API_KEY"
```

* Để kiểm tra danh sách các key đã lưu trong máy của bạn, chạy lệnh:
  ```bash
  dotnet user-secrets list
  ```
* **Cơ chế hoạt động:** Khi chạy `dotnet run`, ASP.NET Core sẽ tự động đọc các giá trị từ `user-secrets` và ghi đè lên các dòng giữ chỗ trong `appsettings.json` mà không làm thay đổi nội dung file trên ổ đĩa.

### Bước 3: Gán Key vào Web Client (`web/.env`)

File `.gitignore` ở thư mục gốc đã chặn toàn bộ các file `**/.env` và `**/.env.*`. Bạn tạo một file tên là `.env` (hoặc `.env.local`) nằm trong thư mục `web/` (`VietnamTravel/web/.env`) với nội dung:

```env
VITE_API_URL=http://localhost:5128/api
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

### Bước 4: Gán cấu hình vào Mobile App (`mobile/.env`)

Tại thư mục `mobile/`, sao chép file mẫu `.env.example` thành `.env`:

```bash
cd mobile
cp .env.example .env
```

Mở file `mobile/.env` và cấu hình như sau:

```env
EXPO_PUBLIC_API_URL=http://localhost:5128/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

### Bước 5: Quy tắc kiểm tra an toàn trước khi `git push`

Trước mỗi lần commit code, luôn chạy lệnh `git status` để kiểm tra:
* Không xuất hiện file `web/.env`, `mobile/.env` hay `*.db` trong danh sách *Changes to be committed*.
* Nếu lỡ tay sửa trực tiếp key thật vào `backend/appsettings.json`, hãy chạy lệnh sau để bỏ theo dõi thay đổi cục bộ của file đó trên máy bạn:
  ```bash
  git update-index --skip-worktree backend/appsettings.json
  ```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án

Để chạy toàn bộ hệ sinh thái (Backend + Web + Mobile), bạn mở 3 cửa sổ Terminal độc lập tương ứng với từng phần:

### Phần 1: Khởi chạy Backend API Server (Cổng 5128)

1. Mở Terminal số 1 và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Khôi phục các gói thư viện NuGet và khởi chạy máy chủ:
   ```bash
   dotnet restore
   dotnet run
   ```
   > **Lưu ý khi cập nhật cấu trúc CSDL mới:** Nếu máy bạn đã từng chạy phiên bản cũ trước đó, hãy xóa file `travel_vietnam.db` cũ đi trước khi gõ `dotnet run` bằng lệnh PowerShell:
   > ```powershell
   > Remove-Item -Path "travel_vietnam.db*" -Force
   > ```
   > Trong `Program.cs`, hệ thống đã tích hợp sẵn `context.Database.Migrate()` và `DbInitializer.SeedUsersAndReviews(context)`. Ngay khi chạy `dotnet run`, Backend sẽ tự động tạo mới `travel_vietnam.db` và nạp sẵn **15 tỉnh thành, 4 danh mục, 20 địa danh du lịch nổi tiếng, 1 tài khoản mẫu và 2 đánh giá mẫu**.

3. Khi màn hình hiện thông báo `Now listening on: http://0.0.0.0:5128`, mở trình duyệt truy cập trang tài liệu Swagger để kiểm tra:
   * **Swagger UI:** `http://localhost:5128/swagger`

---

### Phần 2: Khởi chạy Web Client & Admin Portal (Cổng 5173)

1. Mở Terminal số 2 (giữ nguyên cửa sổ Backend đang chạy) và di chuyển vào thư mục `web`:
   ```bash
   cd web
   npm install
   npm run dev
   ```
2. Mở trình duyệt và truy cập vào địa chỉ:
   * **Giao diện Trang chủ Web:** `http://localhost:5173`
   * **Giao diện Quản trị (Admin):** `http://localhost:5173/admin`

---

### Phần 3: Khởi chạy Mobile App (React Native Expo)

1. Mở Terminal số 3 và di chuyển vào thư mục `mobile`:
   ```bash
   cd mobile
   npm install
   ```

2. Cấu hình kết nối mạng theo thiết bị chạy thử nghiệm:

   * **Trường hợp 1 — Chạy trên Máy ảo Android (Android Emulator - Khuyên dùng):**
     Để tính năng **Đăng nhập bằng Google** trên máy ảo Android gọi về được `http://localhost:5128/api/Auth/google-callback`, bạn **bắt buộc** phải mở cầu nối cổng nội bộ ADB bằng cách chạy lệnh PowerShell sau trên máy tính (sau khi đã bật máy ảo):
     ```powershell
     & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:5128 tcp:5128
     ```
     *(Hoặc gõ `adb reverse tcp:5128 tcp:5128` nếu đã thêm ADB vào PATH).*  
     Khi đó, trong `mobile/.env` đặt là:
     ```env
     EXPO_PUBLIC_API_URL=http://localhost:5128/api
     ```
     *(Nếu chỉ test ở chế độ Khách không dùng Google Login và không chạy `adb reverse`, bạn có thể đặt `EXPO_PUBLIC_API_URL=http://10.0.2.2:5128/api`).*

   * **Trường hợp 2 — Chạy trên Điện thoại thật qua ứng dụng Expo Go (Cùng mạng Wi-Fi):**
     * Mở `cmd` gõ `ipconfig` để tìm địa chỉ **IPv4 Address** của máy tính trong mạng LAN (ví dụ: `192.168.1.15`).
     * Sửa nội dung file `mobile/.env` thành:
       ```env
       EXPO_PUBLIC_API_URL=[http://192.168.1.15:5128/api](http://192.168.1.15:5128/api)
       ```
     * Đảm bảo mạng Wi-Fi trên Windows đang để ở chế độ **Private network**.

3. Khởi động Expo Metro Bundler (kèm cờ `-c` để làm sạch cache):
   ```bash
   npx expo start -c
   ```
4. Nhấn phím **`a`** để mở ứng dụng trên máy ảo Android, hoặc dùng ứng dụng **Expo Go** trên điện thoại quét mã QR hiển thị trên Terminal.

---

## 👤 Phân Quyền Tài Khoản & Cơ Chế Xác Thực Google OAuth 2.0

Hệ thống sử dụng cơ chế xác thực **Google OAuth 2.0** đồng nhất trên cả Web và Mobile, phân quyền tự động theo tên miền email:

| Vai trò | Điều kiện Email / Tài khoản | Quyền hạn và Tính năng |
| :--- | :--- | :--- |
| **Quản trị viên (`Admin`)** | Mọi tài khoản Google thuộc tên miền trường ĐNTU (**`@dntu.edu.vn`** hoặc **`@st.dntu.edu.vn`**) | Tự động được Backend cấp `Role = "Admin"`. Toàn quyền truy cập Cổng Quản trị (`/admin`), xem biểu đồ thống kê, CRUD Địa điểm / Tỉnh thành / Danh mục, quản lý thành viên và xóa bình luận spam. |
| **Thành viên (`User`)** | Mọi tài khoản Google cá nhân thông thường (`@gmail.com`...) | Tự động được Backend cấp `Role = "User"`. Lưu/bỏ lưu sổ tay yêu thích đồng bộ CSDL SQLite, gửi đánh giá sao và nhận xét. |
| **Tài khoản mẫu Seed Data** | `nhankiet1705@gmail.com` (*Hồ Nhân Kiệt* - `Role = "User"`) | Nạp sẵn tự động trong `DbInitializer.cs` kèm 2 đánh giá mẫu tại *Bà Nà Hills* (1 đánh giá 5 sao và 1 đánh giá 1 sao spam) để phục vụ kiểm thử bộ lọc kiểm duyệt. |
| **Khách (`Guest`)** | Không cần đăng nhập | Tra cứu 20 địa danh, tìm kiếm tiếng Việt không phân biệt hoa/thường, lọc theo miền/tỉnh/danh mục, xem thời tiết trực tiếp, lưu sổ tay tạm (`localStorage`) và mở Google Maps. |

### Mẹo kiểm thử nhanh Trang Quản Trị (`/admin`) trên trình duyệt Web:
Ngoài cách đăng nhập trực tiếp bằng email trường (`@...dntu.edu.vn`), khi đang chạy thử nghiệm cục bộ, bạn có thể mở **DevTools (F12) -> Console** trên trình duyệt và dán lệnh sau để giả lập nhanh phiên làm việc Admin:

```javascript
localStorage.setItem('user', JSON.stringify({
  id: 1,
  email: 'admin@dntu.edu.vn',
  fullname: 'Quản trị viên DNTU',
  role: 'Admin'
}));
window.location.href = '/admin';
```

---

## 🧪 Kiểm Thử API Tự Động Với Postman

Trong thư mục gốc của dự án đã đính kèm bộ kịch bản kiểm thử tự động **`VietGuide_TravelApi-v3.postman_collection.json`** (33 kịch bản phủ kín 5 phân nhóm API):
1. Mở ứng dụng **Postman** -> Nhấn **Import** -> Chọn file **`VietGuide_TravelApi-v3.postman_collection.json`**.
2. Đảm bảo Backend đang chạy ở địa chỉ `http://localhost:5128`.
3. Nhấp chuột phải vào Collection -> Chọn **Run collection** -> Bỏ chọn ô *Stop run if an error occurs* -> Nhấn **Start Run**.
4. Toàn bộ 33 kịch bản (Xác thực Google OAuth & Role DNTU, Danh mục, 15 Tỉnh thành, 20 Địa điểm & Nội suy link ảnh CDN, Cache Thời tiết, Sổ tay yêu thích, Đánh giá, Thống kê biểu đồ Admin, Kiểm duyệt bình luận 1 sao spam và Tự động dọn dẹp dữ liệu rác) sẽ chạy tuần tự và báo **Pass (100%)**.

---

## 🔄 Quy Trình Làm Việc Nhóm Trên Git (Git Workflow)

1. **Cập nhật nhánh chính trước khi làm việc:**
   ```bash
   git checkout main
   git pull origin main --rebase
   ```
2. **Tạo nhánh tính năng theo từng phân hệ (`feat/api-...`, `feat/web-...`, `feat/mobile-...`):**
   ```bash
   git checkout -b feat/web-admin-portal
   ```
3. **Kiểm tra file nhạy cảm trước khi Commit & Push:**
   ```bash
   git status
   # Đảm bảo KHÔNG có file .env hoặc *.db nào bị đưa vào staging
   git add .
   git commit -m "feat(api,web): dong bo Google OAuth, CDN image va bo loc tieng Viet"
   git push origin main
   ```