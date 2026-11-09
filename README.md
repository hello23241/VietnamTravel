# 🌏 VietGuide — Hệ Thống Cẩm Nang Du Lịch Việt Nam (Vietnam Travel Guide)

Hệ thống cẩm nang du lịch đa nền tảng giúp tra cứu địa điểm tham quan khắp 3 miền Bắc – Trung – Nam, theo dõi thời tiết thời gian thực qua GPS, lập kế hoạch ngân sách chuyến đi (Sổ tay yêu thích) và quản lý đánh giá cộng đồng. Dự án được tổ chức theo kiến trúc **Monorepo** gồm 3 phân hệ: **Backend RESTful API (.NET 8)**, **Web Client & Admin Portal (React + Vite)** và **Mobile App (React Native + Expo)**.

## 🛠 Công Nghệ & Kiến Trúc Hệ Thống

| Phân hệ | Công nghệ sử dụng | Mô tả chi tiết |
| :--- | :--- | :--- |
| **Backend (`/backend`)** | ASP.NET Core Web API (.NET 8), Entity Framework Core 8, SQLite | Cung cấp RESTful API, tự động khởi tạo & nạp dữ liệu mẫu (`travel_vietnam.db` với 15 tỉnh thành và 20 địa danh), tích hợp `Google.Apis.Auth` xác thực OAuth2, `IMemoryCache` lưu đệm thời tiết OpenWeatherMap (kèm cơ chế Fallback tự động khi thiếu key) và nội suy ảnh qua jsDelivr GitHub CDN. |
| **Web Client (`/web`)** | React 19, Vite 8, Tailwind CSS 3, React Router v7, Axios | Giao diện tra cứu điểm đến cho du khách, tích hợp đăng nhập Google OAuth (`@react-oauth/google`), đồng bộ Sổ tay yêu thích (Wishlist Drawer) tính toán tổng chi phí vé và **Trung tâm Quản trị (Admin Portal)** 5 phân khu có biểu đồ trực quan. |
| **Mobile App (`/mobile`)** | React Native 0.88, Expo SDK 58, React Navigation v7, Axios | Ứng dụng di động đa nền tảng (Android / iOS) tra cứu địa danh theo vùng miền, xem thời tiết trực tiếp, lưu sổ tay dự toán kinh phí, dẫn đường qua Google Maps (`expo-linking`) và mở trang đặt vé trực tuyến (`expo-web-browser`). |
| **Image CDN (`/images`)** | GitHub + jsDelivr CDN | Kho lưu trữ hình ảnh địa danh gốc, được Backend tự động nối đường dẫn qua `https://cdn.jsdelivr.net/gh/hello23241/VietnamTravel@main/images/`. |

## 📁 Cấu Trúc Thư Mục Dự Án

```text
VietnamTravel/
├── .gitignore                              # Bộ lọc file nhạy cảm (.env, *.db, bin, obj, node_modules)
├── README.md                               # Tài liệu hướng dẫn cài đặt & bảo mật API Key
├── VietGuide_TravelApi.postman_collection.json # Bộ kịch bản kiểm thử tự động Postman v2
├── images/                                 # Kho ảnh địa danh phục vụ qua jsDelivr CDN
│
├── backend/                                # Phân hệ ASP.NET Core Web API (.NET 8)
│   ├── Controllers/                        # Admin, Auth, Categories, Favorites, Places, Provinces, Reviews
│   ├── Data/                               # AppDbContext & DbInitializer (Tự động Migrate & Seed 20 địa điểm)
│   ├── DTOs/                               # Các lớp truyền tải dữ liệu (Data Transfer Objects)
│   ├── Middleware/                         # ErrorHandlingMiddleware (Bắt lỗi tập trung)
│   ├── Migrations/                         # Lịch sử khởi tạo cấu trúc bảng SQLite
│   ├── Models/                             # Category, Favorite, Place, Province, Review, User
│   ├── Properties/launchSettings.json      # Cấu hình Kestrel chạy cổng 5128 (http://0.0.0.0:5128)
│   ├── Services/                           # WeatherService (Gọi OpenWeatherMap API + Cache 30 phút + Fallback)
│   ├── appsettings.json                    # Cấu hình mẫu (KHÔNG chứa key thật khi push lên Git)
│   ├── Program.cs                          # Cấu hình DI, CORS, Swagger, Auto-Migration & Seeding
│   └── TravelGuide.Api.csproj              # Cấu hình gói NuGet & UserSecretsId
│
├── web/                                    # Phân hệ Web Client & Admin Portal (React + Vite)
│   ├── src/
│   │   ├── api/                            # apiClient.js & travelApi.js (Tích hợp VITE_API_URL)
│   │   ├── components/                     # Navbar.jsx
│   │   ├── context/                        # AuthContext.jsx & WishlistContext.jsx
│   │   ├── pages/                          # HomePage.jsx, DetailPage.jsx, LoginPage.jsx, AdminPage.jsx
│   │   ├── App.jsx                         # Định tuyến React Router
│   │   └── main.jsx                        # Điểm khởi chạy bọc GoogleOAuthProvider (VITE_GOOGLE_CLIENT_ID)
│   ├── .env                                # File biến môi trường cục bộ (Đã chặn trong .gitignore)
│   ├── package.json                        # Dependencies và Scripts Vite
│   └── vite.config.js                      # Cấu hình Dev Server cổng 5173
│
└── mobile/                                 # Phân hệ Ứng dụng Di động (React Native + Expo)
    ├── assets/                             # Icons và Splash Screen
    ├── src/
    │   ├── api/                            # apiClient.js & travelApi.js (Tích hợp EXPO_PUBLIC_API_URL)
    │   ├── navigation/                     # AppNavigator.js
    │   └── screens/                        # LoginScreen.js, HomeScreen.js, DetailScreen.js, FavoritesScreen.js
    ├── .env                                # File biến môi trường cục bộ (Đã chặn trong .gitignore)
    ├── .env.example                        # File mẫu cấu hình EXPO_PUBLIC_API_URL
    ├── App.js                              # Root Component
    └── package.json                        # Dependencies và Scripts Expo
```

## 📋 Yêu Cầu Cài Đặt Môi Trường

Trước khi thiết lập dự án, hãy đảm bảo máy tính của bạn đã cài đặt đầy đủ các công cụ sau:

1. **.NET 8.0 SDK:** Tải tại trang chủ Microsoft .NET (Kiểm tra bằng lệnh `dotnet --version`).
2. **Node.js (khuyên dùng bản LTS v18 hoặc v20+):** Tải tại trang chủ Node.js (Kiểm tra bằng lệnh `node -v` và `npm -v`).
3. **Git:** Dùng để quản lý mã nguồn (Kiểm tra bằng lệnh `git --version`).
4. **Công cụ chạy Mobile App (Chọn 1 trong 2):**
   * **Máy ảo:** Cài đặt Android Studio (Virtual Device Manager) hoặc Xcode Simulator (trên macOS).
   * **Máy thật:** Tải ứng dụng **Expo Go** trên Google Play Store hoặc Apple App Store.

## 🔐 Hướng Dẫn Lấy & Gán API Key Bảo Mật (Không Lộ Key Khi Push Git)

Dự án sử dụng **Google OAuth Client ID** (cho tính năng đăng nhập Google) và **OpenWeatherMap API Key** (cho tính năng dự báo thời tiết thực tế tại điểm đến). Để tuyệt đối **không làm lộ khóa bí mật (Secret/API Key)** lên GitHub khi `git push`, hãy làm theo đúng quy trình dưới đây.

### Bước 1: Cách lấy các API Key cần thiết

* **Lấy Google OAuth Client ID:**
  1. Truy cập Google Cloud Console, tạo Project mới hoặc chọn Project hiện có.
  2. Vào mục **APIs & Services** -> **OAuth consent screen**, cấu hình thông tin cơ bản và thêm email thử nghiệm.
  3. Vào mục **Credentials** -> **Create Credentials** -> **OAuth client ID**, chọn loại ứng dụng là **Web application**.
  4. Tại mục **Authorized JavaScript origins**, thêm cả 2 địa chỉ: `http://localhost:5173` và `http://localhost`.
  5. Nhấn **Create** và sao chép mã **Client ID** (có định dạng `xxxxxx.apps.googleusercontent.com`).
* **Lấy OpenWeatherMap API Key:**
  1. Đăng ký hoặc đăng nhập tài khoản tại OpenWeatherMap.
  2. Vào mục **My API keys** trong hồ sơ cá nhân để sao chép chuỗi API Key (tài khoản miễn phí hoàn toàn đáp ứng tốt nhu cầu của dự án).
  3. *Lưu ý:* Nếu bạn chưa có hoặc chưa gắn key OpenWeatherMap, `WeatherService` của Backend sẽ tự động kích hoạt chế độ **Fallback thông minh** (sinh dữ liệu thời tiết giả lập theo vĩ độ Bắc/Nam) để ứng dụng không bao giờ bị lỗi.

### Bước 2: Gán Key vào Backend (.NET 8) bằng `dotnet user-secrets`

File `backend/appsettings.json` đang được Git theo dõi (tracked). Nếu bạn điền trực tiếp key vào `appsettings.json`, key sẽ bị đẩy lên GitHub khi commit. Thay vào đó, dự án đã cấu hình sẵn `UserSecretsId` trong `TravelGuide.Api.csproj` — hãy dùng công cụ **Secret Manager** của .NET để lưu key nằm ngoài thư mục code:

Mở Terminal tại thư mục `backend/` và chạy các lệnh sau:

```bash
cd backend

# 1. Gán Google Client ID để xác thực token từ Frontend
dotnet user-secrets set "GoogleAuth:ClientId" "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"

# 2. Gán Email sẽ được tự động cấp quyền Admin khi đăng nhập Google
dotnet user-secrets set "GoogleAuth:AdminEmail" "email_cua_ban@gmail.com"

# 3. Gán OpenWeatherMap API Key để lấy thời tiết thời gian thực
dotnet user-secrets set "OpenWeatherMap:ApiKey" "YOUR_OPENWEATHERMAP_API_KEY"
```

* Để kiểm tra danh sách các key đã lưu an toàn trong máy của bạn, chạy lệnh:
  ```bash
  dotnet user-secrets list
  ```
* **Cơ chế hoạt động:** Khi chạy `dotnet run`, ASP.NET Core sẽ tự động đọc các giá trị từ `user-secrets` và ghi đè lên các dòng `YOUR_..._HERE` trong `appsettings.json` mà không làm thay đổi nội dung file `appsettings.json` trên ổ đĩa.

### Bước 3: Gán Key vào Web Client (`web/.env`)

File `.gitignore` ở thư mục gốc đã chặn toàn bộ các file `**/.env` và `**/.env.*`. Nhờ đó, bạn chỉ cần tạo file `.env` cục bộ trong thư mục `web/` mà không sợ bị đẩy lên Git:

1. Tạo file mới có tên `.env` nằm ngay trong thư mục `web/` (`VietnamTravel/web/.env`).
2. Dán nội dung sau vào file `web/.env`:
   ```env
   VITE_API_URL=http://localhost:5128/api
   VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
   ```
   *(Thay `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` bằng đúng mã Google Client ID bạn đã lấy ở Bước 1).*

### Bước 4: Gán cấu hình vào Mobile App (`mobile/.env`)

1. Tại thư mục `mobile/`, sao chép file mẫu `.env.example` thành `.env`:
   ```bash
   cd mobile
   cp .env.example .env
   ```
2. Mở file `mobile/.env` và cấu hình đường dẫn API phù hợp với thiết bị chạy thử nghiệm (xem chi tiết tại Phần 3 bên dưới).

### Bước 5: Quy tắc kiểm tra an toàn trước khi `git push`

Trước mỗi lần commit code, luôn chạy lệnh `git status` để kiểm tra:
* Tuyệt đối **không** xuất hiện file `web/.env`, `mobile/.env` hay `appsettings.Development.json` (nếu có chứa key) trong danh sách `Changes to be committed`.
* File `backend/appsettings.json` phải luôn giữ nguyên giá trị giữ chỗ mặc định (`YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` và `YOUR_OPENWEATHERMAP_API_KEY_HERE`).
* Nếu lỡ tay sửa trực tiếp key thật vào `backend/appsettings.json`, hãy chạy lệnh sau để bỏ theo dõi thay đổi cục bộ của file đó trên máy bạn:
  ```bash
  git update-index --skip-worktree backend/appsettings.json
  ```

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án

Để chạy toàn bộ hệ sinh thái (Backend + Web + Mobile), bạn mở các cửa sổ Terminal độc lập tương ứng với từng phần:

### Phần 1: Khởi chạy Backend API Server (Cổng `5128`)

1. Mở Terminal số 1 và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Khôi phục các gói thư viện NuGet:
   ```bash
   dotnet restore
   ```
3. Khởi chạy máy chủ API:
   ```bash
   dotnet run
   ```
   * **Lưu ý tự động hóa:** Trong `Program.cs`, hệ thống đã tích hợp sẵn lệnh `context.Database.Migrate()` và `DbInitializer.SeedUsersAndReviews(context)`. Ngay khi chạy `dotnet run`, Backend sẽ **tự động tạo file cơ sở dữ liệu SQLite (`travel_vietnam.db`)**, tạo bảng và nạp sẵn 15 tỉnh thành, 4 danh mục, 20 địa danh du lịch nổi tiếng cùng tài khoản mẫu mà bạn không cần gõ lệnh migration thủ công.
4. Khi màn hình hiện thông báo `Now listening on: http://0.0.0.0:5128`, hãy mở trình duyệt truy cập trang tài liệu Swagger để kiểm tra:
   * **Swagger UI:** `http://localhost:5128/swagger`

### Phần 2: Khởi chạy Web Client & Admin Portal (Cổng `5173`)

1. Mở Terminal số 2 (giữ nguyên cửa sổ Backend đang chạy) và di chuyển vào thư mục `web`:
   ```bash
   cd web
   ```
2. Cài đặt các thư viện Node.js:
   ```bash
   npm install
   ```
3. Đảm bảo bạn đã tạo file `web/.env` chứa `VITE_GOOGLE_CLIENT_ID` và `VITE_API_URL` như hướng dẫn ở mục Bảo mật Key.
4. Khởi động máy chủ phát triển Vite:
   ```bash
   npm run dev
   ```
5. Mở trình duyệt và truy cập vào địa chỉ:
   * **Giao diện Trang chủ Web:** `http://localhost:5173`
   * **Giao diện Quản trị (Admin):** `http://localhost:5173/admin`

### Phần 3: Khởi chạy Mobile App (React Native Expo)

1. Mở Terminal số 3 và di chuyển vào thư mục `mobile`:
   ```bash
   cd mobile
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Cấu hình địa chỉ kết nối trong file `mobile/.env` tùy theo thiết bị bạn sử dụng:
   * **Trường hợp 1 — Chạy trên Máy ảo Android (Android Emulator):**
     * Cách nhanh nhất: Đặt `EXPO_PUBLIC_API_URL=http://10.0.2.2:5128/api` trong `mobile/.env` (vì `10.0.2.2` là địa chỉ IP đại diện cho localhost của máy tính chủ trên trình giả lập Android).
     * Hoặc sử dụng cầu nối ADB: Chạy lệnh `adb reverse tcp:5128 tcp:5128` trên cửa sổ dòng lệnh, sau đó giữ nguyên `EXPO_PUBLIC_API_URL=http://localhost:5128/api`.
   * **Trường hợp 2 — Chạy trên Điện thoại thật qua ứng dụng Expo Go (Cùng mạng Wi-Fi):**
     * Mở `cmd` (trên Windows) gõ `ipconfig` hoặc `ifconfig` (trên macOS/Linux) để tìm địa chỉ **IPv4 Address** của máy tính trong mạng LAN (ví dụ: `192.168.1.15`).
     * Sửa nội dung file `mobile/.env` thành:
       ```env
       EXPO_PUBLIC_API_URL=http://192.168.1.15:5128/api
       ```
     * Đảm bảo tường lửa (Windows Firewall) cho phép kết nối nội bộ qua cổng `5128` (chuyển mạng Wi-Fi sang chế độ *Private network*).
4. Khởi động Expo Metro Bundler (kèm cờ `-c` để xóa cache cũ khi đổi biến `.env`):
   ```bash
   npx expo start -c
   ```
5. Nhấn phím **`a`** để mở trên máy ảo Android, phím **`i`** để mở trên iOS Simulator, hoặc dùng ứng dụng **Expo Go** trên điện thoại quét mã QR hiển thị trên Terminal.

## 👤 Phân Quyền Tài Khoản & Lưu Ý Quan Trọng Về Xác Thực

Khi cơ sở dữ liệu được khởi tạo, `DbInitializer.cs` nạp sẵn 2 tài khoản mẫu trong bảng `Users`:

| Vai trò | Email trong CSDL | Họ và tên | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@vietguide.com` | Quản trị viên Hệ thống | Toàn quyền thống kê biểu đồ, CRUD Địa điểm / Tỉnh thành / Danh mục, quản lý User và xóa bình luận spam. |
| **User** | `kietho@gmail.com` | Hồ Nhân Kiệt | Lưu sổ tay yêu thích đồng bộ CSDL, gửi đánh giá sao và bình luận. |

**Lưu ý kỹ thuật khi kiểm thử Đăng nhập & Trang Admin:**
* **Trên nền tảng Web (`/web`):** Nút đăng nhập sử dụng hoàn toàn **Google OAuth** (`POST /api/Auth/google`). Khi bạn đăng nhập bằng tài khoản Google trùng với email được cấu hình trong `GoogleAuth:AdminEmail` (ở bước `user-secrets`), Backend sẽ gán `Role = "Admin"`. Để mở khóa toàn bộ tính năng trên giao diện `/admin` của Web (vốn kiểm tra điều kiện quản trị trong `AuthContext.jsx` và `AdminPage.jsx`), bạn cũng có thể mở **DevTools (F12) -> Console** trên trình duyệt và dán lệnh sau để giả lập nhanh phiên làm việc Admin khi phát triển cục bộ:
  ```javascript
  localStorage.setItem('user', JSON.stringify({ id: 1, username: 'admin', email: 'admin@vietguide.com', fullname: 'Quản trị viên Hệ thống', role: 'Admin' }));
  window.location.href = '/admin';
  ```
* **Trên nền tảng Mobile (`/mobile`):** Ở màn hình `LoginScreen`, bạn có thể nhấn nút **"Bỏ qua, khám phá với tư cách Khách"** để vào thẳng ứng dụng và trải nghiệm đầy đủ tính năng tra cứu điểm đến, lọc theo vùng miền/tỉnh thành, xem dự báo thời tiết và mở bản đồ dẫn đường Google Maps.

## 🧪 Kiểm Thử API Tự Động Với Postman

Trong thư mục gốc của dự án đã đính kèm file **`VietGuide_TravelApi.postman_collection.json`**. Bạn có thể:
1. Mở ứng dụng **Postman**, chọn **Import** và tải file `VietGuide_TravelApi.postman_collection.json` lên.
2. Đảm bảo biến môi trường `baseUrl` trong Collection đang trỏ về `http://localhost:5128`.
3. Chạy thử từng nhóm API (Categories, Provinces, Places & CDN Image, Weather Cache/Fallback, Favorites, Reviews và Admin Dashboard Stats) với các kịch bản kiểm thử (`pm.test`) đã được viết sẵn.

## 🔄 Quy Trình Làm Việc Nhóm Trên Git (Git Workflow)

1. **Cập nhật nhánh chính trước khi tạo nhánh mới:**
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Tạo nhánh tính năng theo từng phân hệ (`feat/api-...`, `feat/web-...`, `feat/mobile-...`):**
   ```bash
   git checkout -b feat/web-google-auth
   ```
3. **Kiểm tra file nhạy cảm trước khi Commit & Push:**
   ```bash
   git status
   # Đảm bảo KHÔNG có file .env hoặc *.db nào bị đưa vào staging
   git add .
   git commit -m "feat(web): cap nhat tinh nang dang nhap google"
   git push origin feat/web-google-auth
   ```
4. Tạo **Pull Request (PR)** trên GitHub để các thành viên trong nhóm kiểm tra chéo (Code Review) trước khi gộp vào nhánh `main`.
