import React, { createContext, useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { travelApi } from '../api/travelApi';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { currentUser } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Khóa lưu tạm cho khách vãng lai
  const guestStorageKey = 'vietguide_wishlist_guest';

  // Khi người dùng đăng nhập hoặc đổi tài khoản -> Đồng bộ dữ liệu với Backend
  useEffect(() => {
    const syncFavorites = async () => {
      if (!currentUser) {
        // Chế độ khách vãng lai: Đọc từ bộ nhớ tạm trình duyệt
        try {
          const saved = localStorage.getItem(guestStorageKey);
          setWishlist(saved ? JSON.parse(saved) : []);
        } catch {
          setWishlist([]);
        }
        return;
      }

      // Đã đăng nhập: Tải danh sách yêu thích từ CSDL Backend
      try {
        const uid = currentUser.userId || currentUser.id;
        const data = await travelApi.getUserFavorites(uid);
        // Chuẩn hóa dữ liệu trả về từ API Backend (Place object)
        const normalized = (data || []).map((item) => (item.place ? item.place : item));
        setWishlist(normalized);
        localStorage.setItem(`vietguide_wishlist_${currentUser.username}`, JSON.stringify(normalized));
      } catch (err) {
        console.error('Lỗi nạp yêu thích từ CSDL:', err);
        const fallback = localStorage.getItem(`vietguide_wishlist_${currentUser.username}`);
        if (fallback) setWishlist(JSON.parse(fallback));
      }
    };

    syncFavorites();
  }, [currentUser]);

  // Thêm / Bỏ yêu thích có đồng bộ Backend
  const toggleFavorite = async (place) => {
    const exists = wishlist.some((p) => p.id === place.id);
    const updated = exists ? wishlist.filter((p) => p.id !== place.id) : [...wishlist, place];
    setWishlist(updated);

    if (currentUser) {
      // Lưu offline dự phòng
      localStorage.setItem(`vietguide_wishlist_${currentUser.username}`, JSON.stringify(updated));
      // Gọi API Backend ghi trực tiếp vào bảng Favorites trong SQLite
      try {
        const uid = currentUser.userId || currentUser.id;
        await travelApi.toggleFavorite(uid, place.id);
      } catch (err) {
        console.error('Lỗi đồng bộ yêu thích lên Backend:', err);
      }
    } else {
      localStorage.setItem(guestStorageKey, JSON.stringify(updated));
    }
  };

  // Xóa toàn bộ sổ tay
  const clearWishlist = async () => {
    const oldList = [...wishlist];
    setWishlist([]);

    if (currentUser) {
      localStorage.removeItem(`vietguide_wishlist_${currentUser.username}`);
      const uid = currentUser.userId || currentUser.id;
      // Gỡ từng địa điểm trên CSDL Backend
      for (const item of oldList) {
        try {
          await travelApi.toggleFavorite(uid, item.id);
        } catch (e) {}
      }
    } else {
      localStorage.removeItem(guestStorageKey);
    }
  };

  const totalBudget = wishlist.reduce((acc, cur) => acc + (cur.ticketPriceAvg || 0), 0);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        count: wishlist.length,
        isOpen,
        openWishlist: () => setIsOpen(true),
        closeWishlist: () => setIsOpen(false),
        toggleFavorite,
        clearWishlist,
        totalBudget,
      }}
    >
      {children}

      {/* DRAWER SỔ TAY KẾ HOẠCH & ĐIỂM ĐẾN */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    <i className="fa-solid fa-heart text-base"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">Kế Hoạch & Điểm Đến</h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {currentUser
                        ? `Đồng bộ CSDL (${currentUser.fullname || currentUser.username})`
                        : 'Sổ tay khách vãng lai'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {wishlist.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-300 text-xl">
                      <i className="fa-regular fa-bookmark"></i>
                    </div>
                    <p className="text-sm font-bold text-slate-700">Chưa có điểm đến nào trong sổ tay</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                      Bấm vào biểu tượng trái tim ở mỗi địa điểm để lưu lại lịch trình nhé!
                    </p>
                  </div>
                ) : (
                  wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100/80 hover:border-slate-200 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200/50"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                            {item.name}
                          </h5>
                          <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                            📍 {item.provinceName || item.address} •{' '}
                            <span className="text-emerald-600 font-bold">
                              {item.ticketPriceAvg > 0
                                ? `${Number(item.ticketPriceAvg).toLocaleString('vi-VN')} đ`
                                : 'Miễn phí'}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Link
                          to={`/place/${item.id}`}
                          onClick={() => setIsOpen(false)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-bold px-2 py-1 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          Xem
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item)}
                          title="Bỏ thích"
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-sm">
                    <i className="fa-solid fa-wallet"></i>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Tổng ngân sách vé:</span>
                    <span className="text-[10px] text-slate-400">Ước tính theo giá vé</span>
                  </div>
                </div>
                <span className="text-base font-black text-emerald-700">
                  {totalBudget.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              {wishlist.length > 0 && (
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="w-full py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200/80 transition-colors"
                >
                  Xóa toàn bộ kế hoạch
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}