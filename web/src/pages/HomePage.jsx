import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { travelApi } from '../api/travelApi';
import { useWishlist } from '../context/WishlistContext';

const REGIONS = [
  { id: 'all', label: 'Tất cả Vùng Miền', icon: 'fa-earth-asia' },
  { id: 'Bắc', label: 'Miền Bắc', icon: 'fa-mountain' },
  { id: 'Trung', label: 'Miền Trung', icon: 'fa-sun' },
  { id: 'Nam', label: 'Miền Nam', icon: 'fa-water' },
];

const SORT_OPTIONS = [
  { id: 'danhgia', label: 'Đánh giá cao nhất', icon: 'fa-star text-amber-400' },
  { id: 'giatang', label: 'Giá vé: Thấp → Cao', icon: 'fa-arrow-up-1-9 text-emerald-500' },
  { id: 'giagiam', label: 'Giá vé: Cao → Thấp', icon: 'fa-arrow-down-9-1 text-teal-600' },
  { id: 'ten', label: 'Tên địa danh (A-Z)', icon: 'fa-arrow-down-a-z text-slate-500' },
];

export default function HomePage() {
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [provinceDetail, setProvinceDetail] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('danhgia');

  // Trạng thái Dropdown & Gợi ý
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const { wishlist, toggleFavorite } = useWishlist();
  const navigate = useNavigate();

  const regionRef = useRef(null);
  const sortRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (regionRef.current && !regionRef.current.contains(event.target)) {
        setIsRegionOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProvinces();
  }, [selectedRegion]);

  useEffect(() => {
    loadPlaces();
  }, [selectedRegion, selectedProvince, activeCategory, selectedSort]);

  const loadCategories = async () => {
    try {
      const data = await travelApi.getCategories();
      setCategories(data || []);
    } catch (e) {
      console.log('Lỗi categories:', e);
    }
  };

  const loadProvinces = async () => {
    try {
      const regParam = selectedRegion === 'all' ? undefined : selectedRegion;
      const data = await travelApi.getProvinces(regParam);
      setProvinces(data || []);
      setSelectedProvince('');
      setProvinceDetail(null);
    } catch (e) {
      console.log('Lỗi provinces:', e);
    }
  };

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const res = await travelApi.getPlaces({
        categoryId: activeCategory === 'all' ? undefined : activeCategory,
        provinceId: selectedProvince ? Number(selectedProvince) : undefined,
        sortBy: selectedSort,
        tuKhoa: searchTerm.trim() || undefined,
        pageSize: 50,
      });

      let items = res?.items || (Array.isArray(res) ? res : []);
      if (selectedRegion !== 'all' && !selectedProvince) {
        items = items.filter((p) => {
          if (!p.region) return true;
          return p.region.toLowerCase().includes(selectedRegion.toLowerCase());
        });
      }
      setPlaces(items);
    } catch (e) {
      console.log('Lỗi places:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProvince = async (provIdStr) => {
    if (selectedProvince === provIdStr) {
      setSelectedProvince('');
      setProvinceDetail(null);
    } else {
      setSelectedProvince(provIdStr);
      try {
        const detail = await travelApi.getProvinceDetail(provIdStr);
        setProvinceDetail(detail);
      } catch (e) {
        setProvinceDetail(null);
      }
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    const q = value.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const matched = places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.provinceName && p.provinceName.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q))
    );
    setSuggestions(matched);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (place) => {
    setSearchTerm(place.name);
    setShowSuggestions(false);
    navigate(`/place/${place.id}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    loadPlaces();
  };

  const handleExploreClick = (e) => {
    e.preventDefault();
    const target = document.getElementById('destinations-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentRegionLabel = REGIONS.find((r) => r.id === selectedRegion)?.label || 'Tất cả Vùng Miền';
  const currentSortObj = SORT_OPTIONS.find((s) => s.id === selectedSort) || SORT_OPTIONS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* ============================================================== */}
      {/* 1. HERO BANNER                                                 */}
      {/* ============================================================== */}
      <section className="relative w-full bg-slate-50 overflow-hidden">
        <div className="w-full max-w-[1920px] mx-auto relative">
          <img
            src="/cam-nang-du-lich.png"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1920&q=85';
            }}
            alt="Cẩm Nang Du Lịch Việt Nam - VietGuide"
            className="w-full h-[340px] sm:h-[460px] md:h-[560px] lg:h-[640px] object-cover object-center"
          />

          {/* Nút bấm Khám Phá Ngay cách rời dòng chữ slogan */}
          <div className="absolute top-[75%] sm:top-[76%] md:top-[77%] lg:top-[79%] left-5 sm:left-12 md:left-20 lg:left-28 z-20">
            <button
              type="button"
              onClick={handleExploreClick}
              className="inline-flex items-center gap-2 sm:gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-950/25 hover:shadow-emerald-700/40 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-emerald-500/40 group cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] group-hover:rotate-45 transition-transform duration-300">
                <i className="fa-solid fa-compass text-emerald-200"></i>
              </span>
              <span>Khám Phá Ngay</span>
              <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
            </button>
          </div>

          {/* Dải Gradient chuyển mờ chân banner */}
          <div className="absolute inset-x-0 bottom-0 h-16 sm:h-24 md:h-32 bg-gradient-to-t from-slate-50 via-slate-50/40 to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. KHUNG TÌM KIẾM & BỘ LỌC NỔI                                */}
      {/* ============================================================== */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 md:-mt-10 relative z-30">
        <div className="bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-2xl shadow-slate-300/60 border border-slate-200/90 text-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <i className="fa-solid fa-compass text-emerald-600"></i> Tra Cứu Tọa Độ
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Khám phá hơn 20+ danh lam thắng cảnh và ẩm thực 3 miền
            </span>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2.5 relative">
            <div ref={searchRef} className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                autoComplete="off"
                value={searchTerm}
                onFocus={() => {
                  if (searchTerm.trim().length > 0) setShowSuggestions(true);
                }}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm theo tên địa danh, tỉnh thành..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
              />

              {showSuggestions && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col max-h-[320px] overflow-y-auto text-left divide-y divide-slate-100">
                  {suggestions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Không tìm thấy địa điểm nào khớp với "{searchTerm}"
                    </div>
                  ) : (
                    suggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectSuggestion(item)}
                        className="p-3 hover:bg-emerald-50/70 cursor-pointer flex items-center gap-3 transition-colors group"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-100 shadow-sm group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                            <span>📍 {item.provinceName || item.address}</span>
                            <span>•</span>
                            <span className="text-amber-500 font-bold">★ {item.ratingAvg?.toFixed(1) || '5.0'}</span>
                          </div>
                        </div>
                        <i className="fa-solid fa-chevron-right text-xs text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all"></i>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div ref={regionRef} className="relative min-w-[200px]">
              <button
                type="button"
                onClick={() => setIsRegionOpen(!isRegionOpen)}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-semibold flex items-center justify-between transition-all ${
                  isRegionOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500 bg-white shadow-sm'
                    : 'border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <span className="text-slate-800 truncate">{currentRegionLabel}</span>
                <i
                  className={`fa-solid fa-chevron-down text-xs text-slate-400 ml-2 transition-transform duration-200 ${
                    isRegionOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                ></i>
              </button>

              {isRegionOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5 z-50 text-left overflow-hidden">
                  {REGIONS.map((r) => {
                    const isSelected = selectedRegion === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedRegion(r.id);
                          setIsRegionOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <i className={`fa-solid ${r.icon} text-slate-400 text-xs w-4`}></i>
                          <span>{r.label}</span>
                        </div>
                        {isSelected && <i className="fa-solid fa-check text-emerald-600 text-xs"></i>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 shrink-0"
            >
              <i className="fa-solid fa-filter"></i>
              <span>Lọc Kết Quả</span>
            </button>
          </form>

          {provinces.length > 0 && (
            <div className="flex items-center gap-1.5 pt-3.5 px-1 overflow-x-auto text-xs font-medium text-slate-600 border-t border-slate-100 mt-3.5">
              <span className="text-slate-400 text-[11px] shrink-0 font-bold uppercase tracking-wider">
                Tỉnh thành:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedProvince('');
                  setProvinceDetail(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedProvince === ''
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({provinces.reduce((acc, p) => acc + (p.totalPlaces || 0), 0)})
              </button>
              {provinces.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProvince(String(p.id))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedProvince === String(p.id)
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>📍 {p.name}</span>
                  <span className="text-[10px] opacity-75">({p.totalPlaces || 0})</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2.5 px-1 overflow-x-auto text-xs font-medium text-slate-600">
            <span className="text-slate-400 text-[11px] shrink-0 font-bold uppercase tracking-wider">
              Thể loại:
            </span>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(activeCategory === String(c.id) ? 'all' : String(c.id))}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                  activeCategory === String(c.id)
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. THẺ THỐNG KÊ NHANH                                         */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-200/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-map-location-dot"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{places.length}+</div>
              <div className="text-xs text-slate-500 font-medium">Điểm Đến Trọng Điểm</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-umbrella-beach"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">3 Miền</div>
              <div className="text-xs text-slate-500 font-medium">Bắc - Trung - Nam</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-comments"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-medium">Cẩm Nang & Đánh Giá</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-shield-heart"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">24/7</div>
              <div className="text-xs text-slate-500 font-medium">Đồng Hành Du Khách</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. LƯỚI ĐIỂM ĐẾN                                              */}
      {/* ============================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="destinations-section">
        {provinceDetail && (
          <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-teal-50 via-emerald-50 to-slate-50 rounded-3xl border border-teal-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-lg shadow-sm">
                <i className="fa-solid fa-location-dot"></i>
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Khám phá: {provinceDetail.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white">
                    {provinceDetail.region}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Đang hiển thị danh sách các tọa độ du lịch hấp dẫn tại khu vực này ({provinceDetail.totalPlaces || places.length} điểm đến).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedProvince('');
                setProvinceDetail(null);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-white text-xs font-bold transition-all self-start sm:self-auto shrink-0"
            >
              Xem tất cả tỉnh
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-slate-200 mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Khám Phá Các Tọa Độ Hấp Dẫn
            </h2>
            <p className="text-sm text-slate-500 mt-1">Lựa chọn chuyến đi tiếp theo của bạn từ cơ sở dữ liệu cẩm nang du lịch</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Hiển thị {places.length} điểm đến</span>

            <div ref={sortRef} className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`text-xs font-semibold px-3.5 py-2.5 rounded-2xl border flex items-center gap-2 transition-all ${
                  isSortOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500 bg-white text-emerald-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <i className={`fa-solid ${currentSortObj.icon}`}></i>
                <span>{currentSortObj.label}</span>
                <i
                  className={`fa-solid fa-chevron-down text-[10px] text-slate-400 ml-1 transition-transform duration-200 ${
                    isSortOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                ></i>
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 overflow-hidden">
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = selectedSort === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedSort(opt.id);
                          setIsSortOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <i className={`fa-solid ${opt.icon} text-xs w-4`}></i>
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <i className="fa-solid fa-check text-emerald-600 text-xs"></i>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500">Đang tải danh sách điểm đến...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-2xl mb-4">
              <i className="fa-solid fa-magnifying-glass"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Không tìm thấy điểm đến phù hợp</h3>
            <p className="text-sm text-slate-500 mt-1">Vui lòng thử lại với từ khóa khác hoặc điều chỉnh bộ lọc vùng miền, tỉnh thành.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {places.map((item) => {
              const isFav = wishlist.some((w) => w.id === item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  <Link to={`/place/${item.id}`} className="relative h-56 w-full overflow-hidden bg-slate-100 block">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 z-10">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-600/90 backdrop-blur-md text-white shadow-sm">
                        {item.region || 'Việt Nam'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/70 backdrop-blur-md text-white">
                        {item.categoryName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(item);
                      }}
                      className={`absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full ${
                        isFav ? 'bg-rose-500 text-white' : 'bg-white/80 backdrop-blur-md text-slate-700 hover:text-rose-500'
                      } flex items-center justify-center shadow-md transition-all`}
                    >
                      <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`}></i>
                    </button>
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1 text-slate-400">
                          <i className="fa-solid fa-location-dot text-emerald-500"></i> {item.provinceName}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-amber-500">
                          <i className="fa-solid fa-star"></i> {item.ratingAvg?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                      <Link to={`/place/${item.id}`}>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 mb-2">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
                        {item.description || item.address}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Chi phí dự kiến</span>
                        <span className="text-xs font-bold text-slate-800">
                          {item.ticketPriceAvg > 0
                            ? `${Number(item.ticketPriceAvg).toLocaleString('vi-VN')} đ`
                            : 'Miễn phí'}
                        </span>
                      </div>
                      <Link
                        to={`/place/${item.id}`}
                        className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Xem Cẩm Nang</span>
                        <i className="fa-solid fa-arrow-right text-[11px]"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* 5. MỤC KINH NGHIỆM DU LỊCH BỎ TÚI                              */}
      {/* ============================================================== */}
      <section className="bg-slate-100 py-16 border-t border-slate-200" id="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Kinh Nghiệm & Cẩm Nang Bỏ Túi
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Những lời khuyên hữu ích giúp chuyến hành trình của bạn trọn vẹn và an toàn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-cloud-sun"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Thời Điểm Du Lịch</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Mỗi miền có đặc trưng khí hậu riêng. Miền Bắc lý tưởng vào mùa thu đông, miền Trung tránh mùa mưa bão, miền Nam mát mẻ quanh năm.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-bowl-food"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Khám Phá Ẩm Thực Bản Địa</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Thưởng thức món ngon tại các chợ dân sinh, quán ăn truyền thống. Đừng quên phở Bắc, mì Quảng miền Trung hay bún quậy Nam Bộ.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-wallet"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Tối Ưu Ngân Sách Đi Lại</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Đặt vé máy bay trước 1-2 tháng, thuê xe máy tự trải nghiệm các cung đường đèo và luôn chuẩn bị sẵn tiền mặt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. CHÂN TRANG (FOOTER)                                         */}
      {/* ============================================================== */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              onError={(e) => {
                e.currentTarget.src =
                  'https://cdn.jsdelivr.net/gh/hello23241/VietnamTravel@main/images/icon.png';
              }}
              alt="VietGuide Logo"
              className="w-10 h-10 rounded-2xl object-contain bg-white p-1"
            />
            <div>
              <span className="font-bold text-white text-base">VietGuide Travel</span>
              <p className="text-xs text-slate-500">Cẩm Nang Hướng Dẫn Du Lịch Khám Phá Việt Nam</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 VietGuide. Nền tảng cẩm nang du lịch trực tuyến.
          </p>
        </div>
      </footer>
    </div>
  );
}