import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, User, Lock, ArrowLeft, ShieldAlert, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { travelApi } from '../api/travelApi';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullname.trim()) throw new Error('Vui lòng nhập họ và tên');
        await travelApi.register(username.trim(), password, fullname.trim());
        setSuccessMsg('Đăng ký tài khoản thành công! Bây giờ bạn có thể đăng nhập ngay.');
        setIsRegister(false);
      } else {
        const res = await travelApi.login(username.trim(), password);
        login(res);
        if (res.username === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Thao tác không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-200 mb-3">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {isRegister ? 'Đăng ký tài khoản' : 'Chào mừng trở lại'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRegister
              ? 'Tạo tài khoản để gửi nhận xét và quản lý chuyến đi'
              : 'Đăng nhập để trải nghiệm trọn vẹn dịch vụ'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên</label>
              <input
                type="text"
                required
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Ví dụ: Hiệu Duy Kiệt"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên tài khoản</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username..."
                className="w-full px-3 py-2.5 pl-9 text-sm border border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full px-3 py-2.5 pl-9 pr-10 text-sm border border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {/* ĐÃ ĐẢO CHUẨN THỨ TỰ LOGIC MẮT MỞ / MẮT NHẮM */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Đang hiện mật khẩu' : 'Đang ẩn mật khẩu'}
              >
                {showPassword ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 mt-2"
          >
            {loading ? 'Đang xử lý...' : isRegister ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            {isRegister
              ? 'Đã có tài khoản? Quay lại Đăng nhập'
              : 'Chưa có tài khoản? Bấm vào đây để Đăng ký'}
          </button>
        </div>
      </div>
    </div>
  );
}