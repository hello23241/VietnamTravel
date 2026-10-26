import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function Navbar() {
  const { currentUser, logout, isAdmin } = useAuth();
  const { count, openWishlist } = useWishlist();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Đóng menu khi nhấp chuột ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <i className="fa-solid fa-compass text-xl"></i>
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
              VietGuide
            </span>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest -mt-1">
              Khám phá Việt Nam
            </span>
          </div>
        </Link>

        {/* Menu Điều hướng */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <Link to="/" className="hover:text-emerald-600 transition-colors">
            Điểm Đến
          </Link>
          <a href="#features-section" className="hover:text-emerald-600 transition-colors">
            Văn Hóa & Ẩm Thực
          </a>
        </nav>

        {/* Cụm Tiện ích & Tài khoản bên phải */}
        <div className="flex items-center gap-3">
          {/* Nút Sổ tay Yêu thích */}
          <button
            type="button"
            onClick={openWishlist}
            title="Xem kế hoạch chuyến đi đã lưu"
            className="relative p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all"
          >
            <i className="fa-regular fa-heart text-lg"></i>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-in zoom-in">
                {count}
              </span>
            )}
          </button>

          {currentUser ? (
            /* BẤM CHUỘT (CLICK) ĐỂ MỞ HOẶC ĐÓNG MENU */
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border transition-all ${
                  isUserMenuOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200/80 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-sm font-black shadow-sm">
                  {currentUser.fullname ? currentUser.fullname.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black text-slate-800 leading-tight">
                    {currentUser.fullname || currentUser.username}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    {isAdmin ? (
                      <>
                        <i className="fa-solid fa-shield-halved text-[9px]"></i> Quản trị viên
                      </>
                    ) : (
                      'Thành viên'
                    )}
                  </div>
                </div>
                <i
                  className={`fa-solid fa-chevron-down text-[10px] text-slate-400 ml-1 transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                ></i>
              </button>

              {/* POPUP DROPDOWN MENU KHI BẤM CHUỘT */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 text-left overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl mb-1.5 border border-slate-100">
                    <div className="text-xs font-black text-slate-800 truncate">
                      {currentUser.fullname || currentUser.username}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">@{currentUser.username}</div>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                      <i className="fa-solid fa-circle-check text-[8px]"></i>
                      <span>{isAdmin ? 'Quyền Quản Trị Hệ Thống' : 'Tài Khoản Thành Viên'}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="py-1 border-b border-slate-100 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
                        Công cụ Quản trị
                      </span>
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                          <i className="fa-solid fa-shield-halved"></i>
                        </div>
                        <div>
                          <div>Cổng Quản Trị Nội Dung</div>
                          <div className="text-[10px] text-slate-400 font-normal">Kiểm duyệt & xóa đánh giá</div>
                        </div>
                      </Link>
                    </div>
                  )}

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openWishlist();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors group text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-heart"></i>
                      </div>
                      <div>
                        <div>Sổ tay & Kế hoạch</div>
                        <div className="text-[10px] text-slate-400 font-normal">{count} địa điểm đã lưu</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors group text-left mt-1"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                      </div>
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all shadow-emerald-500/20"
            >
              <i className="fa-solid fa-user text-xs"></i>
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}