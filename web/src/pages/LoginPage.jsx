import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Compass, ArrowLeft, ShieldAlert } from 'lucide-react';
import { travelApi } from '../api/travelApi';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setErrorMsg('');
      const user = await travelApi.loginWithGoogle(credentialResponse.credential);
      login(user);
      
      // Nếu đúng tài khoản email admin cấu hình thì vào thẳng trang Admin
      if (user.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập Google thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600">
        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center">
        <img
          src="/icon.png"
          onError={(e) => {
            e.currentTarget.src = 'https://cdn.jsdelivr.net/gh/hello23241/VietnamTravel@main/images/icon.png';
          }}
          alt="VietGuide Logo"
          className="w-20 h-20 rounded-2xl object-contain bg-white border border-slate-100 p-1 mx-auto shadow-lg shadow-emerald-500/10 mb-3"
        />
        <h2 className="text-2xl font-black text-slate-900">Đăng Nhập VietGuide</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Sử dụng tài khoản Google để đồng bộ sổ tay chuyến đi và quyền quản trị
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErrorMsg('Không thể kết nối đến tài khoản Google')}
            useOneTap
            shape="pill"
          />
        </div>
      </div>
    </div>
  );
}