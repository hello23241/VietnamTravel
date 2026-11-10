import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Compass,
  MapPin,
  CloudSun,
  Heart,
  Sparkles,
  CheckCircle2,
  BookmarkCheck,
  MessageSquareText,
  Navigation,
} from 'lucide-react';
import { travelApi } from '../api/travelApi';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const user = await travelApi.loginWithGoogle(credentialResponse.credential);
      login(user);

      if (user.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 relative flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans overflow-hidden">
      {/* Vùng sáng ambient mờ nền tạo chiều sâu không gian */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800/40 grid grid-cols-1 lg:grid-cols-12 min-h-[660px] z-10">
        {/* ========================================================= */}
        {/* CỘT TRÁI (7 CỘT): ẢNH ĐỊA DANH KẾT HỢP DANH MỤC TÍNH NĂNG */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 relative hidden md:flex flex-col justify-between p-8 lg:p-10 text-white overflow-hidden bg-slate-900">
          {/* Ảnh nền danh lam thắng cảnh thực tế */}
          <img
            src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=85"
            alt="Non Nước Việt Nam"
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          {/* Lớp phủ đa tầng bảo đảm độ tương phản chữ */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/60" />

          {/* Phần đầu: Nút quay lại & Tiêu đề */}
          <div className="relative z-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-emerald-300 transition-colors bg-white/10 hover:bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
            </Link>

            <div className="mt-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" /> Nền Tảng Cẩm Nang Du Lịch Số
              </span>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight mt-2.5">
                Khám Phá Việt Nam <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                  Theo Cách Của Riêng Bạn
                </span>
              </h1>
              <p className="text-xs lg:text-sm text-slate-300 mt-2 max-w-lg leading-relaxed">
                Đồng hành cùng VietGuide lên kế hoạch cho những chuyến hành trình trọn vẹn khắp 3 miền Bắc – Trung – Nam.
              </p>
            </div>
          </div>

          {/* Phần giữa: 3 Khối tính năng thẻ kính giúp lấp đầy khung hình */}
          <div className="relative z-10 space-y-3 my-4">
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white">Tọa Độ Du Lịch Chuẩn Bản Địa</h2>
                <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                  Dẫn đường Google Maps chính xác, thông tin giá vé và ẩm thực đặc sản từng vùng miền.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                <CloudSun className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white">Trạm Khí Tượng Thời Tiết Trực Tiếp</h2>
                <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                  Cập nhật nhiệt độ, độ ẩm và khuyến nghị trang phục thời gian thực theo tọa độ GPS.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white">Sổ Tay Yêu Thích & Dự Toán Chi Phí</h2>
                <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                  Lưu các điểm muốn đến và tự động cộng dồn tổng ngân sách vé tham quan cho chuyến đi.
                </p>
              </div>
            </div>
          </div>

          {/* Phần chân cột trái: Thống kê định lượng */}
          <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 20+ Tọa độ trọng điểm
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 15 Tỉnh thành 3 miền
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Hoàn toàn miễn phí
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI (5 CỘT): KHUNG ĐĂNG NHẬP GOOGLE HOÀN CHỈNH       */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div className="flex md:hidden justify-between items-center mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600"
            >
              <ArrowLeft className="w-4 h-4" /> Trang chủ
            </Link>
          </div>

          <div className="my-auto max-w-sm mx-auto w-full text-center space-y-5">
            {/* Logo nhận diện gọn gàng */}
            <div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 p-2 mx-auto shadow-sm flex items-center justify-center mb-3">
                <img
                  src="/icon.png"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://cdn.jsdelivr.net/gh/hello23241/VietnamTravel@main/images/icon.png';
                  }}
                  alt="VietGuide Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Chào Mừng Trở Lại</h2>
              <p className="text-xs text-slate-500 mt-1">
                Đăng nhập để đồng bộ sổ tay hành trình và chia sẻ trải nghiệm
              </p>
            </div>

            {/* Thông báo lỗi */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-xs font-semibold flex items-center gap-2 text-left animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Khối tính năng quyền lợi khi đăng nhập */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quyền lợi thành viên
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                <BookmarkCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đồng bộ sổ tay điểm đến trên mọi thiết bị</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                <MessageSquareText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chia sẻ đánh giá và kinh nghiệm thực tế</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mở bản đồ chỉ đường và thông tin dự toán vé</span>
              </div>
            </div>

            {/* Khung nút đăng nhập Google */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <span className="text-[11px] font-bold text-slate-500 block">
                Xác thực tài khoản Google
              </span>

              <div className="flex justify-center w-full min-h-[44px]">
                {loading ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 py-2.5">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span>Đang đồng bộ phiên làm việc...</span>
                  </div>
                ) : (
                  <div className="w-full flex justify-center [&>div]:!w-full [&>div>iframe]:!w-full">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setErrorMsg('Không thể kết nối đến tài khoản Google')}
                      useOneTap
                      shape="pill"
                      size="large"
                      width="340"
                      text="continue_with"
                    />
                  </div>
                )}
              </div>

              {/* Phân cách hoặc */}
              <div className="relative pt-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-white px-2.5 text-slate-400 font-medium">hoặc</span>
                </div>
              </div>

              {/* Nút vào xem nhanh ở chế độ khách */}
              <Link
                to="/"
                className="w-full py-2.5 px-4 rounded-full border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Khám phá với tư cách Khách</span>
              </Link>
            </div>

            {/* Dòng ghi chú bảo mật thân thiện */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cam kết bảo mật thông tin an toàn tuyệt đối</span>
            </div>
          </div>

          {/* Bản quyền chân trang */}
          <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
            VietGuide © 2026 • Cẩm Nang Hướng Dẫn Du Lịch Việt Nam
          </div>
        </div>
      </div>
    </div>
  );
}