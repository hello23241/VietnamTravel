import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { travelApi } from '../api/travelApi';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Trạng thái Custom Dropdown Địa điểm
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.username !== 'admin') {
      alert('Chỉ tài khoản Quản trị viên (admin) mới có quyền truy cập trang này!');
      navigate('/');
      return;
    }
    setCurrentUser(user);
    initAdminData();
  }, []);

  // Đóng dropdown khi nhấp chuột ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initAdminData = async () => {
    try {
      setLoading(true);
      const res = await travelApi.getPlaces({ pageSize: 50 });
      const placeList = res.items || [];
      setPlaces(placeList);
      if (placeList.length > 0) {
        setSelectedPlace(placeList[0]);
        loadReviewsForPlace(placeList[0].id);
      }
    } catch (err) {
      console.error('Lỗi nạp admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewsForPlace = async (placeId) => {
    try {
      setRefreshing(true);
      const data = await travelApi.getReviews(placeId);
      setReviews(data || []);
    } catch (err) {
      console.error('Lỗi reviews:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    setIsDropdownOpen(false);
    loadReviewsForPlace(place.id);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này khỏi cơ sở dữ liệu?')) {
      return;
    }

    try {
      await travelApi.deleteReview(reviewId);
      alert('Đã xóa đánh giá vi phạm thành công!');
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa đánh giá');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Đang khởi tạo Cổng Quản Trị...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* 1. HEADER BANNER ADMIN */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors mb-3"
            >
              <i className="fa-solid fa-arrow-left"></i> Quay lại trang chủ người dùng
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl shadow-lg">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Cổng Quản Trị Nội Dung</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kiểm duyệt, giám sát và gỡ bỏ các đánh giá vi phạm tiêu chuẩn cộng đồng.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Đang trực</span>
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                {currentUser?.fullname || 'Quản trị viên'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NỘI DUNG QUẢN TRỊ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* THANH BỘ CHỌN ĐỊA ĐIỂM TÙY BIẾN CAO CẤP (CUSTOM DROPDOWN - HẾT PHÈN) */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">
                Chọn địa điểm du lịch để kiểm duyệt đánh giá:
              </label>
              <p className="text-xs text-slate-500">Bấm để chuyển đổi giữa các địa danh trong cơ sở dữ liệu</p>
            </div>

            <button
              type="button"
              onClick={() => selectedPlace && loadReviewsForPlace(selectedPlace.id)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
            >
              <i className={`fa-solid fa-rotate ${refreshing ? 'animate-spin text-emerald-600' : ''}`}></i>
              <span>{refreshing ? 'Đang làm mới...' : 'Làm mới danh sách'}</span>
            </button>
          </div>

          {/* Nút kích hoạt Dropdown tùy biến */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full p-3.5 bg-slate-50 border rounded-2xl text-left flex items-center justify-between transition-all ${
                isDropdownOpen
                  ? 'border-emerald-500 ring-2 ring-emerald-500 bg-white shadow-md'
                  : 'border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              {selectedPlace ? (
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={selectedPlace.imageUrl}
                    alt={selectedPlace.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 truncate">{selectedPlace.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-emerald-700">📍 {selectedPlace.provinceName}</span>
                      <span>•</span>
                      <span className="text-amber-500 font-bold">
                        ★ {selectedPlace.ratingAvg ? selectedPlace.ratingAvg.toFixed(1) : '5.0'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">{selectedPlace.categoryName}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-400">Chọn một địa điểm...</span>
              )}

              <div className="flex items-center gap-2 pl-3 border-l border-slate-200/80 shrink-0">
                <span className="text-xs font-bold text-slate-400 hidden sm:inline">Thay đổi</span>
                <i
                  className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                ></i>
              </div>
            </button>

            {/* DANH SÁCH MENU THẢ XUỐNG ĐƯỢC DESIGNER ĐẸP ĐẼ & BO TRÒN */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 max-h-80 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                {places.map((p) => {
                  const isCurrent = selectedPlace?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPlace(p)}
                      className={`p-3 rounded-2xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                        isCurrent ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{p.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>📍 {p.provinceName}</span>
                            <span>•</span>
                            <span className="text-amber-500 font-bold">★ {p.ratingAvg?.toFixed(1) || '5.0'}</span>
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                          <i className="fa-solid fa-check"></i>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. BẢNG DANH SÁCH NHẬN XÉT CẦN KIỂM DUYỆT */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                <i className="fa-solid fa-comments"></i>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Danh sách nhận xét ({reviews.length})
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Đang xem đánh giá của: <strong className="text-slate-700">{selectedPlace?.name}</strong>
                </span>
              </div>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mx-auto mb-3 text-2xl text-slate-300">
                <i className="fa-solid fa-comment-slash"></i>
              </div>
              <h4 className="text-sm font-bold text-slate-700">Không có đánh giá nào</h4>
              <p className="text-xs text-slate-400 mt-1">Địa điểm này hiện chưa có đánh giá nào cần kiểm duyệt.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                        {(rev.userFullname || rev.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-black text-slate-900">{rev.userFullname || rev.username}</span>
                      <span className="text-amber-500 font-bold text-xs flex items-center gap-1">
                        <i className="fa-solid fa-star"></i> {rev.rating} sao
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-mono font-bold">
                        ID #{rev.id}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      "{rev.comment}"
                    </p>
                  </div>

                  {/* Nút Xóa vi phạm */}
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="self-end sm:self-center px-4 py-2 bg-rose-50 hover:bg-rose-600 border border-rose-200 text-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Xóa vi phạm</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}