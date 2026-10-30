import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { travelApi } from '../api/travelApi';
import { useWishlist } from '../context/WishlistContext';

export default function DetailPage() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [weather, setWeather] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Đánh giá
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const { wishlist, toggleFavorite } = useWishlist();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {}
    }
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [placeData, weatherData, reviewsData] = await Promise.all([
        travelApi.getPlaceDetail(id),
        travelApi.getPlaceWeather(id).catch(() => null),
        travelApi.getReviews(id).catch(() => []),
      ]);
      setPlace(placeData);
      setWeather(weatherData);
      setReviews(reviewsData || []);
    } catch (err) {
      console.error('Lỗi tải chi tiết:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Vui lòng đăng nhập để gửi nhận xét');
      return;
    }
    if (!comment.trim()) {
      alert('Vui lòng nhập nội dung nhận xét');
      return;
    }

    try {
      setSubmitting(true);
      await travelApi.addReview(currentUser.userId || currentUser.id, id, rating, comment.trim());
      setComment('');
      alert('Đã gửi đánh giá thành công!');
      const [updatedReviews, updatedPlace] = await Promise.all([
        travelApi.getReviews(id),
        travelApi.getPlaceDetail(id),
      ]);
      setReviews(updatedReviews || []);
      setPlace(updatedPlace);
    } catch (err) {
      alert(err.message || 'Lỗi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Đang chuẩn bị cẩm nang điểm đến...</p>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl mb-4">
          <i className="fa-solid fa-map-location-dot"></i>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy thông tin điểm đến</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">Địa điểm này có thể đã bị gỡ hoặc đường dẫn không đúng.</p>
        <Link to="/" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const isFav = wishlist.some((item) => item.id === place.id);

  // Sinh nội dung ẩm thực đặc sản theo địa phương
  const getLocalFoods = (prov, reg) => {
    const p = (prov || '').toLowerCase();
    if (p.includes('hà nội')) {
      return [
        { name: 'Phở Bò Gia Truyền', desc: 'Nước dùng ninh xương đậm đà, thơm thảo mộc quế hồi đặc trưng thủ đô.' },
        { name: 'Cà Phê Trứng Giảng', desc: 'Vị béo ngậy của kem trứng bông xốp hòa quyện cà phê đậm đà phố cổ.' },
        { name: 'Bún Chả Nem Rán', desc: 'Chả nướng than hoa thơm lừng chấm cùng nước mắm chua ngọt và rau sống.' },
      ];
    } else if (p.includes('đà lạt') || p.includes('lâm đồng')) {
      return [
        { name: 'Bánh Tráng Nướng Cầu Đất', desc: 'Được mệnh danh là "Pizza Việt Nam" giòn rụm với trứng, bơ, tép và bò khô.' },
        { name: 'Lẩu Gà Lá É Ép Gai', desc: 'Vị the the thơm nồng đặc trưng của lá é hòa cùng nước luộc gà ngọt thanh.' },
        { name: 'Sữa Đậu Nành & Bánh Ngọt', desc: 'Thức quà ấm nóng giữa khí trời se lạnh về đêm ở chợ Đà Lạt.' },
      ];
    } else if (p.includes('đà nẵng') || p.includes('quảng nam')) {
      return [
        { name: 'Mì Quảng Ếch & Tôm Thịt', desc: 'Sợi mì vàng óng ăn kèm nước nhưn đậm đà, bánh tráng nướng giòn tan.' },
        { name: 'Bánh Tráng Cuốn Thịt Heo', desc: 'Thịt ba chỉ hai đầu da cuốn ghém rau rừng chấm mắm nêm thơm nức.' },
      ];
    } else if (p.includes('hà giang')) {
      return [
        { name: 'Thắng Cố Chợ Phiên', desc: 'Món ăn truyền thống đậm đà của đồng bào vùng cao bên chén rượu ngô.' },
        { name: 'Bánh Tam Giác Mạch', desc: 'Bánh nướng bùi bùi thơm ngát hương hoa vùng cao nguyên đá.' },
      ];
    }
    return [
      { name: 'Đặc sản ẩm thực địa phương', desc: 'Thưởng thức các món ngon truyền thống tại các quán ăn gia truyền xung quanh.' },
      { name: 'Chè và thức uống giải nhiệt', desc: 'Trải nghiệm phong vị giải khát đường phố bản địa tươi mát.' },
    ];
  };

  const localFoods = getLocalFoods(place.provinceName, place.region);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* 1. THANH ĐIỀU HƯỚNG BREADCRUMB & THAO TÁC NHANH */}
      <div className="bg-white border-b border-slate-200/80 sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 truncate">
            <Link to="/" className="hover:text-emerald-600 transition-colors flex items-center gap-1 font-semibold">
              <i className="fa-solid fa-house"></i>
              <span>Trang chủ</span>
            </Link>
            <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
            <span className="text-slate-600 font-semibold">{place.region || 'Điểm đến'}</span>
            <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
            <span className="text-emerald-700 font-bold truncate">{place.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleFavorite(place)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                isFav
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-rose-500`}></i>
              <span>{isFav ? 'Đã lưu sổ tay' : 'Lưu điểm đến'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* 2. GRAND HERO BANNER */}
        <div className="relative h-80 sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 group">
          <img
            src={place.imageUrl}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/50 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md">
                {place.region || 'Việt Nam'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
                {place.categoryName}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-white flex items-center gap-1 shadow-sm">
                <i className="fa-solid fa-star text-amber-200"></i>
                <span>{place.ratingAvg ? place.ratingAvg.toFixed(1) : '5.0'} / 5.0</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">{place.name}</h1>
            <p className="text-xs sm:text-sm text-slate-200 flex items-center gap-2 mt-2 font-medium">
              <i className="fa-solid fa-location-dot text-emerald-400 text-sm"></i>
              <span>{place.address}</span>
            </p>
          </div>
        </div>

        {/* 3. THANH THÔNG SỐ NHANH BỎ TÚI (QUICK SPECS - HẾT TRẮNG TRỐNG) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Thời lượng</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800">2 - 4 tiếng trải nghiệm</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg shrink-0">
              <i className="fa-solid fa-calendar-days"></i>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Mùa lý tưởng</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800">Quanh năm (Mùa khô)</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0">
              <i className="fa-solid fa-motorcycle"></i>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Phương tiện</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800">Xe máy, Ô tô, Taxi</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shrink-0">
              <i className="fa-solid fa-shirt"></i>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Trang phục</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800">Thoải mái, lịch sự</span>
            </div>
          </div>
        </div>

        {/* 4. NỘI DUNG CHÍNH (2 CỘT: TRÁI ĐẬM ĐÀ, PHẢI TIỆN ÍCH) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* CỘT TRÁI (8 CỘT): MÔ TẢ, LỊCH TRÌNH, ẨM THỰC, MẸO, ĐÁNH GIÁ */}
          <div className="lg:col-span-8 space-y-8">
            {/* Giới thiệu & Tổng quan */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-circle-info"></i>
                </div>
                <h2 className="text-lg font-black text-slate-900">Giới thiệu & Cảm hứng điểm đến</h2>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {place.description ||
                  `Khám phá vẻ đẹp kỳ thú tại ${place.name}, một trong những điểm check-in và tham quan tiêu biểu tọa lạc tại ${place.address}. Nơi đây hội tụ nét đặc sắc về cảnh quan thiên nhiên và bản sắc văn hóa địa phương, thu hút đông đảo du khách trong và ngoài nước ghé thăm hàng năm.`}
              </p>

              {/* Điểm nhấn nổi bật */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Điểm nhấn không thể bỏ lỡ
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100 flex items-center gap-1.5">
                    <i className="fa-solid fa-camera text-emerald-600"></i> Góc chụp ảnh check-in triệu view
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold border border-teal-100 flex items-center gap-1.5">
                    <i className="fa-solid fa-compass text-teal-600"></i> Không gian thoáng đãng trong lành
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-100 flex items-center gap-1.5">
                    <i className="fa-solid fa-leaf text-amber-600"></i> Phù hợp cả gia đình & bạn bè
                  </span>
                </div>
              </div>
            </div>

            {/* Lịch trình gợi ý khám phá (Suggested Itinerary) */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-calendar-check"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Gợi ý lịch trình trải nghiệm</h3>
                  <span className="text-xs text-slate-400 font-medium">Tối ưu thời gian để không bỏ sót khoảnh khắc đẹp</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-black rounded-xl h-fit">
                    Buổi Sáng
                  </span>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">Đón bình minh & Check-in khung cảnh sớm</h5>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      Có mặt từ 7h00 - 8h30 sáng khi thời tiết mát mẻ và ánh sáng tự nhiên dịu nhất. Đây là khung giờ vàng để dạo bước ngắm cảnh và chụp những bức ảnh lưu niệm không bị đông đúc.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <span className="px-3 py-1 bg-teal-600 text-white text-xs font-black rounded-xl h-fit">
                    Buổi Chiều
                  </span>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">Thưởng lãm kiến trúc & Ngắm hoàng hôn</h5>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      Dành thời gian tìm hiểu về nét văn hóa, lịch sử và dạo quanh các góc cà phê, ngắm hoàng hôn buông xuống phủ ánh vàng lên toàn bộ cảnh sắc.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <span className="px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-xl h-fit">
                    Buổi Tối
                  </span>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">Hòa mình vào không khí đêm & Ẩm thực</h5>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      Thưởng thức các món ăn đường phố ấm nồng xung quanh điểm đến, dạo bước ngắm đèn phố lung linh và tận hưởng sự thư thái.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Khám phá Ẩm thực & Đặc sản lân cận */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-utensils"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Món ngon & Ẩm thực không nên bỏ qua</h3>
                  <span className="text-xs text-slate-400 font-medium">Những phong vị đặc trưng tại {place.provinceName}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {localFoods.map((f, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-xs">
                    <div className="font-extrabold text-amber-900 text-sm flex items-center gap-2 mb-1.5">
                      <i className="fa-solid fa-bowl-food text-amber-500"></i>
                      <span>{f.name}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mẹo du lịch bỏ túi */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-lightbulb"></i>
                </div>
                <h3 className="text-lg font-black text-slate-900">Mẹo du lịch hữu ích bỏ túi</h3>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 list-disc list-inside">
                <li className="leading-relaxed">
                  <strong className="text-slate-800">Chuẩn bị tiền mặt:</strong> Một số bãi đỗ xe hoặc quầy lưu niệm xung quanh có thể không hỗ trợ quét mã QR chuyển khoản.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-slate-800">Giữ gìn vệ sinh chung:</strong> Bỏ rác đúng nơi quy định để chung tay bảo vệ cảnh quan du lịch Việt Nam luôn sạch đẹp.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-slate-800">Bảo quản tư trang cá nhân:</strong> Tại các khu vực tập trung đông người, luôn cẩn thận với điện thoại, túi ví và máy ảnh.
                </li>
              </ul>
            </div>

            {/* ĐÁNH GIÁ TỪ CỘNG ĐỒNG */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                    <i className="fa-solid fa-comments"></i>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Đánh giá từ cộng đồng du khách ({reviews.length})
                  </h3>
                </div>
                <span className="text-amber-500 font-extrabold text-sm flex items-center gap-1">
                  <i className="fa-solid fa-star"></i> {place.ratingAvg ? place.ratingAvg.toFixed(1) : '5.0'} / 5.0
                </span>
              </div>

              {/* Form Gửi Đánh Giá */}
              <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 mb-6">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Chia sẻ trải nghiệm chuyến đi của bạn
                </h5>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-500 font-semibold">Chấm điểm sao:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        className={`text-lg transition-transform hover:scale-125 ${
                          s <= rating ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-600 ml-2">{rating} / 5 sao</span>
                </div>

                <textarea
                  required
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    currentUser
                      ? 'Viết cảm nhận của bạn về cảnh sắc, dịch vụ, con người nơi đây...'
                      : 'Vui lòng đăng nhập để gửi nhận xét...'
                  }
                  disabled={!currentUser}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
                ></textarea>

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    {currentUser ? `Đang nhận xét với tên: ${currentUser.fullname || currentUser.username}` : 'Chưa đăng nhập'}
                  </span>
                  <button
                    type="submit"
                    disabled={submitting || !currentUser}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm"
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>{submitting ? 'Đang gửi...' : 'Gửi Nhận Xét'}</span>
                  </button>
                </div>
              </form>

              {/* Danh sách bình luận */}
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 italic">
                    Chưa có đánh giá nào cho điểm đến này. Hãy là người đầu tiên chia sẻ cảm nhận!
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">
                            {(rev.userFullname || rev.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-extrabold text-slate-800">{rev.userFullname || rev.username}</span>
                        </div>
                        <span className="text-amber-500 font-bold">
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed pl-9">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (4 CỘT): GIÁ VÉ, THỜI TIẾT LIVE, ĐỊNH VỊ GOOGLE MAPS, SỔ TAY */}
          <div className="lg:col-span-4 space-y-6">
            {/* Thẻ Chi phí vé vào */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Chi phí vé tham quan
              </span>
              <div className="text-3xl font-black text-emerald-600">
                {place.ticketPriceAvg > 0
                  ? `${Number(place.ticketPriceAvg).toLocaleString('vi-VN')} VNĐ`
                  : 'Miễn phí vé vào'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Giá vé có thể thay đổi tùy theo quy định của ban quản lý</p>

              <button
                type="button"
                onClick={() => toggleFavorite(place)}
                className={`w-full mt-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isFav
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200'
                }`}
              >
                <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                <span>{isFav ? 'Đã lưu trong Sổ tay của bạn' : 'Lưu vào Sổ tay yêu thích'}</span>
              </button>
            </div>

            {/* Widget Thời tiết Trực tiếp (Live Weather Card) */}
            <div className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white p-6 rounded-3xl shadow-xl shadow-emerald-900/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-100 flex items-center gap-1.5">
                  <i className="fa-solid fa-satellite-dish animate-pulse"></i> Trạm Khí Tượng Live
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20">OpenWeather</span>
              </div>

              {weather ? (
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight">
                      {Math.round(weather.temperature)}°C
                    </span>
                    <span className="text-xs font-bold capitalize text-teal-100">{weather.condition || weather.description}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/20 text-xs text-teal-50">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-droplet text-teal-200"></i>
                      <span>Độ ẩm: <strong>{weather.humidity}%</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-wind text-teal-200"></i>
                      <span>Gió: <strong>3.5 m/s</strong></span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-teal-100 py-3 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang cập nhật số liệu thời tiết...</span>
                </div>
              )}
            </div>

            {/* Thẻ Vị Trí & Dẫn đường Google Maps */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tọa độ & Bản đồ chỉ đường</h4>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vĩ độ (Latitude):</span>
                  <span className="font-mono font-bold text-slate-800">{place.latitude ? place.latitude.toFixed(4) : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Kinh độ (Longitude):</span>
                  <span className="font-mono font-bold text-slate-800">{place.longitude ? place.longitude.toFixed(4) : 'N/A'}</span>
                </div>
              </div>

              <a
                href={
                  place.mapUrl ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`
                }
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <i className="fa-solid fa-diamond-turn-right text-emerald-400"></i>
                <span>Mở dẫn đường Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}