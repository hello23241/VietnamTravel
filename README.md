# Ứng Dụng Cẩm Nang Du Lịch Việt Nam (Vietnam Travel Guide)

Hệ thống ứng dụng di động tra cứu thông tin du lịch, dự báo thời tiết thời gian thực và quản lý đánh giá địa điểm du lịch Việt Nam. Dự án được tổ chức theo mô hình **Monorepo** kết hợp giữa Backend RESTful API (.NET 8) và Frontend Di động (React Native Expo).

---

## 🛠 Công Nghệ & Kiến Trúc

### Backend (`/backend`)
* **Nền tảng:** ASP.NET Core Web API (.NET 8)
* **ORM & Cơ sở dữ liệu:** Entity Framework Core 8, SQLite (`travel_vietnam.db`)
* **Xác thực:** BCrypt.Net mã hóa mật khẩu, Quản lý phân quyền Role-based (Admin / User)
* **Dịch vụ bên thứ ba:** OpenWeatherMap API (tích hợp cơ chế Fallback tự động khi mất mạng hoặc thiếu API key)
* **Tài liệu API:** Swagger UI / OpenAPI Spec v1

### Frontend Mobile (`/mobile`)
* **Nền tảng:** React Native (Expo SDK)
* **Điều hướng:** React Navigation (Native Stack & Bottom Tabs)
* **Giao tiếp mạng:** Axios Client với cấu hình Base URL động qua `.env`
* **Lưu trữ dữ liệu cục bộ:** `@react-native-async-storage/async-storage`
* **Tiện ích hệ thống:** `expo-linking` (mở chỉ đường Google Maps bằng tọa độ GPS), `expo-web-browser` (mở trang đặt vé đối tác)

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
VietnamTravel/
├── .gitignore                      # Bộ lọc file rác tổng hợp (.NET, Node, SQLite, OS)
├── README.md                       # Tài liệu hướng dẫn cài đặt & vận hành dự án
│
├── backend/                        # Toàn bộ mã nguồn ASP.NET Core Web API
│   ├── Controllers/                # Auth, Categories, Provinces, Places, Reviews, Favorites
│   ├── Data/                       # AppDbContext và Seed Data
│   ├── DTOs/                       # DTOs cho Auth, Place, PagedResult, Weather
│   ├── Models/                     # Category, Favorite, Place, Province, Review, User
│   ├── Properties/                 # launchSettings.json (Cấu hình Kestrel 0.0.0.0:5128)
│   ├── Services/                   # WeatherService & IWeatherService (OpenWeatherMap)
│   ├── appsettings.json            # Connection String & API Keys
│   ├── Program.cs                  # Pipeline khởi tạo dịch vụ, CORS, HttpClient
│   └── TravelGuide.Api.csproj      # File cấu hình project .NET
│
└── mobile/                         # Toàn bộ mã nguồn React Native (Expo)
    ├── assets/                     # Icons, hình ảnh tĩnh, splash screen
    ├── src/
    │   ├── api/                    # apiClient.js (Axios) và travelApi.js
    │   ├── components/             # Reusable UI components
    │   ├── navigation/             # AppNavigator.js
    │   ├── screens/                # LoginScreen, HomeScreen, DetailScreen
    │   └── utils/                  # Hàm tiện ích dùng chung
    ├── .env                        # File biến môi trường (chứa EXPO_PUBLIC_API_URL)
    ├── .env.example                # File mẫu biến môi trường
    ├── App.js                      # Root Component của ứng dụng di động
    ├── app.json                    # Cấu hình định danh Expo
    └── package.json                # Dependencies và Scripts chạy Node.js
```

---

## 📋 Yêu Cầu Cài Đặt Môi Trường

Trước khi bắt đầu, đảm bảo máy tính đã cài đặt các công cụ sau:
1. **[.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)** (Kiểm tra bằng lệnh: `dotnet --version`)
2. **[Node.js LTS (v18.x hoặc v20.x)](https://nodejs.org/)** (Kiểm tra bằng lệnh: `node -v` và `npm -v`)
3. **[Git](https://git-scm.com/)**
4. Công cụ chạy ứng dụng di động:
   * **Cách 1 (Khuyên dùng):** Cài đặt [Android Studio](https://developer.android.com/studio) và khởi tạo thiết bị ảo Android Emulator.
   * **Cách 2:** Cài đặt ứng dụng **Expo Go** từ Google Play Store hoặc Apple App Store trên điện thoại thật.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local)

Dự án yêu cầu chạy song song **2 cửa sổ Terminal độc lập**:

### CỬA SỔ TERMINAL 1: KHỞI CHẠY BACKEND

1. Mở Terminal tại thư mục gốc `VietnamTravel` và di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```

2. Phục hồi các thư viện NuGet phụ thuộc:
   ```bash
   dotnet restore
   ```

3. Khởi tạo Cơ sở dữ liệu SQLite và nạp dữ liệu mẫu ban đầu:
   ```bash
   dotnet ef database update
   ```
   *(Lưu ý: Nếu máy chưa nhận lệnh `dotnet ef`, chạy lệnh sau để cài đặt công cụ toàn cục: `dotnet tool install --global dotnet-ef`)*

4. Khởi chạy Web API Server:
   ```bash
   dotnet run
   ```
   Khi Terminal xuất hiện dòng `Now listening on: http://0.0.0.0:5128`, server đã sẵn sàng.

5. Kiểm tra tài liệu API:
   * Mở trình duyệt web truy cập: `http://localhost:5128/swagger`
   * Toàn bộ 6 nhóm endpoint (Auth, Categories, Provinces, Places, Reviews, Favorites) sẽ hiển thị đầy đủ và có thể kiểm thử trực tiếp.

---

### CỬA SỔ TERMINAL 2: KHỞI CHẠY MOBILE CLIENT

1. Mở một cửa sổ Terminal mới (không đóng cửa sổ Backend) và di chuyển vào thư mục mobile:
   ```bash
   cd mobile
   ```

2. Cài đặt các thư viện Node.js:
   ```bash
   npm install
   ```

3. Cấu hình biến môi trường kết nối API:
   Tạo file `.env` ngay trong thư mục `mobile/` (dựa trên mẫu `.env.example`):
   ```powershell
   cp .env.example .env
   ```

4. Cập nhật giá trị trong file `mobile/.env` theo đúng thiết bị dùng để test:

   * **Trường hợp A: Test trên Android Emulator (Đề xuất)**
     Mở một tab PowerShell và chạy lệnh mở cầu nối cổng nội bộ ADB:
     ```powershell
     & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:5128 tcp:5128
     ```
     *(Hoặc gõ `adb reverse tcp:5128 tcp:5128` nếu đã thêm ADB vào PATH. Lệnh này giúp máy ảo kết nối thẳng vào `localhost:5128` của máy tính).*  
     Khi đó, nội dung file `mobile/.env` đặt là:
     ```env
     EXPO_PUBLIC_API_URL=http://localhost:5128/api
     ```
     *(Nếu không dùng lệnh `adb reverse`, có thể đặt: `EXPO_PUBLIC_API_URL=http://10.0.2.2:5128/api`)*

   * **Trường hợp B: Test trên Điện thoại thật qua mạng Wi-Fi (Expo Go)**
     1. Mở `cmd`, gõ `ipconfig` để lấy địa chỉ **IPv4 Address** của card Wi-Fi (ví dụ: `192.168.1.15`).
     2. Đảm bảo điện thoại và máy tính kết nối **chung một mạng Wi-Fi** và mạng trên Windows để ở chế độ **Private network**.
     3. Cập nhật `mobile/.env`:
        ```env
        EXPO_PUBLIC_API_URL=[http://192.168.1.15:5128/api](http://192.168.1.15:5128/api)
        ```

5. Khởi động Metro Bundler của Expo:
   ```bash
   npx expo start -c
   ```

6. Mở giao diện ứng dụng:
   * **Trên máy ảo Android:** Nhấn phím **`a`** trên bàn phím Terminal.
   * **Trên điện thoại thật:** Mở ứng dụng **Expo Go**, quét mã QR hiển thị trên Terminal.

---

## 🔑 Tài Khoản Thử Nghiệm Hệ Thống

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn và Tính năng |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin` | `admin123` | Quản trị dữ liệu, kiểm duyệt và xóa đánh giá vi phạm |
| **Người dùng (User)** | `kietho` | `123456` | Lưu/bỏ lưu địa điểm yêu thích, gửi đánh giá sao và bình luận |
| **Khách (Guest)** | *(Không cần)* | *(Không cần)* | Tra cứu, tìm kiếm từ khóa, lọc theo vùng miền/danh mục, xem thời tiết GPS |

---

## 🔄 Quy Trình Phối Hợp Làm Việc Trên Git (Feature Branch Workflow)

Nhóm làm việc chung trên một Repository theo quy tắc phân nhánh tính năng để tránh xung đột mã nguồn (Merge Conflict):

1. **Luôn cập nhật nhánh chính trước khi làm:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Quy tắc đặt tên nhánh theo phân công:**
   * **Thành viên phụ trách Backend:** Tạo nhánh bắt đầu bằng `feat/api-...`  
     *Ví dụ:* `feat/api-weather-service`, `feat/api-reviews-crud`
   * **Thành viên phụ trách Mobile:** Tạo nhánh bắt đầu bằng `feat/mobile-...`  
     *Ví dụ:* `feat/mobile-detail-screen`, `feat/mobile-favorite-list`
   ```bash
   git checkout -b feat/<module>-<ten-tinh-nang>
   ```

3. **Commit và đẩy mã nguồn:**
   ```bash
   git add .
   git commit -m "feat(<module>): mo ta ngan gon noi dung da lam"
   git push origin feat/<module>-<ten-tinh-nang>
   ```

4. **Tạo Pull Request (PR):**
   * Mở Pull Request trên GitHub để gộp từ nhánh tính năng vào nhánh `main`.
   * Thành viên còn lại thực hiện kiểm tra chéo (Code Review) và xác nhận gộp code.