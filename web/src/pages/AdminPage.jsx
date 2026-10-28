import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { travelApi } from '../api/travelApi';

const REGION_OPTIONS = [
  { value: 'Bắc', label: 'Miền Bắc', icon: 'fa-mountain' },
  { value: 'Trung', label: 'Miền Trung', icon: 'fa-sun' },
  { value: 'Nam', label: 'Miền Nam', icon: 'fa-water' },
];

// Component Dropdown tùy biến đồng bộ giao diện
function CustomSelect({ label, value, options, onChange, placeholder, theme = 'emerald' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const activeRing =
    theme === 'amber'
      ? 'border-amber-500 ring-2 ring-amber-500 bg-white'
      : 'border-emerald-500 ring-2 ring-emerald-500 bg-white';
  const activeItem = theme === 'amber' ? 'text-amber-700 bg-amber-50 font-bold' : 'text-emerald-700 bg-emerald-50 font-bold';
  const checkColor = theme === 'amber' ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-slate-700 mb-1 font-bold text-xs">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-normal text-xs flex items-center justify-between transition-all ${
          open ? `${activeRing} shadow-sm` : 'border-slate-200 hover:bg-slate-100/70'
        }`}
      >
        <span className="text-slate-800 truncate flex items-center gap-2">
          {selectedOption?.icon && <i className={`fa-solid ${selectedOption.icon} text-slate-400 text-xs`}></i>}
          <span>{selectedOption ? selectedOption.label : placeholder || 'Chọn...'}</span>
        </span>
        <i
          className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ml-2 shrink-0 ${
            open ? `rotate-180 ${checkColor}` : ''
          }`}
        ></i>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                  isSelected ? activeItem : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <i className={`fa-solid ${opt.icon} text-slate-400 text-xs w-3.5 shrink-0`}></i>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <i className={`fa-solid fa-check ${checkColor} text-xs ml-2 shrink-0`}></i>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('places');

  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Thêm Địa Điểm
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submittingPlace, setSubmittingPlace] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    provinceId: '',
    region: 'Bắc',
    address: '',
    ticketPriceAvg: 0,
    imageUrl: '',
    description: '',
    latitude: 21.0285,
    longitude: 105.8542,
  });

  // Form Chỉnh Sửa Địa Điểm (PUT /api/Places/{id})
  const [editingPlace, setEditingPlace] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    categoryId: '',
    provinceId: '',
    region: 'Bắc',
    address: '',
    ticketPriceAvg: 0,
    imageUrl: '',
    description: '',
    latitude: 21.0285,
    longitude: 105.8542,
  });

  // Tab 2: Kiểm Duyệt Đánh Giá
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [refreshingReviews, setRefreshingReviews] = useState(false);
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
    initAllData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initAllData = async () => {
    try {
      setLoading(true);
      const [placesRes, catsRes, provsRes] = await Promise.all([
        travelApi.getPlaces({ pageSize: 100 }),
        travelApi.getCategories().catch(() => []),
        travelApi.getProvinces().catch(() => []),
      ]);

      const placeList = placesRes?.items || (Array.isArray(placesRes) ? placesRes : []);
      setPlaces(placeList);
      setCategories(catsRes || []);
      setProvinces(provsRes || []);

      if (placeList.length > 0) {
        setSelectedPlace(placeList[0]);
        loadReviewsForPlace(placeList[0].id);
      }

      if (catsRes?.length > 0 && provsRes?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          categoryId: prev.categoryId || catsRes[0].id,
          provinceId: prev.provinceId || provsRes[0].id,
        }));
      }
    } catch (err) {
      console.error('Lỗi khởi tạo Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewsForPlace = async (placeId) => {
    try {
      setRefreshingReviews(true);
      const data = await travelApi.getReviews(placeId);
      setReviews(data || []);
    } catch (err) {
      console.error('Lỗi reviews:', err);
    } finally {
      setRefreshingReviews(false);
    }
  };

  const handleOpenEditModal = (place) => {
    setEditingPlace(place);
    setEditFormData({
      name: place.name || '',
      categoryId: place.categoryId || categories[0]?.id || '',
      provinceId: place.provinceId || provinces[0]?.id || '',
      region: place.region || 'Bắc',
      address: place.address || '',
      ticketPriceAvg: place.ticketPriceAvg || 0,
      imageUrl: place.imageUrl || '',
      description: place.description || '',
      latitude: place.latitude || 21.0285,
      longitude: place.longitude || 105.8542,
    });
  };

  const handleUpdatePlaceSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim() || !editFormData.address.trim()) {
      alert('Vui lòng điền tên địa điểm và địa chỉ');
      return;
    }

    try {
      setSubmittingEdit(true);
      const payload = {
        name: editFormData.name.trim(),
        categoryId: Number(editFormData.categoryId),
        provinceId: Number(editFormData.provinceId),
        region: editFormData.region,
        address: editFormData.address.trim(),
        ticketPriceAvg: Number(editFormData.ticketPriceAvg) || 0,
        imageUrl:
          editFormData.imageUrl.trim() ||
          'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
        description: editFormData.description.trim(),
        latitude: Number(editFormData.latitude) || 0,
        longitude: Number(editFormData.longitude) || 0,
      };

      await travelApi.updatePlace(editingPlace.id, payload);
      alert(`Đã cập nhật thông tin địa điểm "${editFormData.name}" thành công!`);

      setEditingPlace(null);
      const updated = await travelApi.getPlaces({ pageSize: 100 });
      setPlaces(updated?.items || (Array.isArray(updated) ? updated : []));
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật địa điểm');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCreatePlaceSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Vui lòng điền đầy đủ tên địa điểm và địa chỉ');
      return;
    }

    try {
      setSubmittingPlace(true);
      const payload = {
        name: formData.name.trim(),
        categoryId: Number(formData.categoryId),
        provinceId: Number(formData.provinceId),
        region: formData.region,
        address: formData.address.trim(),
        ticketPriceAvg: Number(formData.ticketPriceAvg) || 0,
        imageUrl:
          formData.imageUrl.trim() ||
          'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
        description: formData.description.trim(),
        latitude: Number(formData.latitude) || 0,
        longitude: Number(formData.longitude) || 0,
      };

      await travelApi.createPlace(payload);
      alert(`Đã thêm địa điểm "${formData.name}" thành công vào CSDL!`);

      setIsAddModalOpen(false);
      setFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        provinceId: provinces[0]?.id || '',
        region: 'Bắc',
        address: '',
        ticketPriceAvg: 0,
        imageUrl: '',
        description: '',
        latitude: 21.0285,
        longitude: 105.8542,
      });

      const updated = await travelApi.getPlaces({ pageSize: 100 });
      setPlaces(updated?.items || (Array.isArray(updated) ? updated : []));
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo địa điểm mới');
    } finally {
      setSubmittingPlace(false);
    }
  };

  const handleDeletePlace = async (placeId, placeName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa địa điểm "${placeName}" khỏi hệ thống?`)) {
      return;
    }

    try {
      await travelApi.deletePlace(placeId);
      alert('Đã xóa địa điểm thành công!');
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa địa điểm');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhận xét vi phạm này?')) return;
    try {
      await travelApi.deleteReview(reviewId);
      alert('Đã xóa nhận xét vi phạm!');
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa nhận xét');
    }
  };

  // Chuẩn bị danh sách options cho CustomSelect
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
    icon: 'fa-tags',
  }));

  const provinceOptions = provinces.map((p) => ({
    value: p.id,
    label: p.name,
    icon: 'fa-location-dot',
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Đang chuẩn bị Bảng Điều Khiển Quản Trị...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* 1. HEADER BANNER */}
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
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Trung Tâm Quản Trị VietGuide</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thêm mới, cập nhật thông tin điểm đến và kiểm duyệt nội dung cộng đồng.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Đang đăng nhập</span>
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                {currentUser?.fullname || 'Quản trị viên'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CHỌN TAB QUẢN TRỊ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl p-2 shadow-lg border border-slate-200/80 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('places')}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'places'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-map-location-dot"></i>
            <span>Quản Lý Điểm Đến ({places.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'reviews'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-comments"></i>
            <span>Kiểm Duyệt Nhận Xét</span>
          </button>
        </div>
      </div>

      {/* 3. NỘI DUNG TỪNG TAB */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* TAB 1: QUẢN LÝ ĐIỂM ĐẾN */}
        {activeTab === 'places' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Danh Mục Tọa Độ Du Lịch</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thêm mới, chỉnh sửa thông tin hoặc xóa điểm tham quan trong cơ sở dữ liệu
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/25 shrink-0"
              >
                <i className="fa-solid fa-plus text-sm"></i>
                <span>Thêm Điểm Đến Mới</span>
              </button>
            </div>

            {/* LƯỚI DANH SÁCH ĐỊA ĐIỂM */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all"
                >
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                        {p.region || 'Việt Nam'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-white">
                        {p.categoryName}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
                        <span>📍 {p.provinceName}</span>
                        <span className="text-amber-500 font-bold">★ {p.ratingAvg?.toFixed(1) || '5.0'}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {p.description || p.address}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700">
                        {p.ticketPriceAvg > 0 ? `${Number(p.ticketPriceAvg).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/place/${p.id}`}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          Xem
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white text-xs font-bold transition-colors flex items-center gap-1"
                          title="Chỉnh sửa thông tin"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlace(p.id, p.name)}
                          className="p-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-xs font-bold transition-colors"
                          title="Xóa địa điểm"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: KIỂM DUYỆT ĐÁNH GIÁ */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Chọn địa điểm để kiểm tra đánh giá:
                  </label>
                  <p className="text-xs text-slate-500">Xem và gỡ bỏ bình luận rác hoặc tiêu cực không phù hợp</p>
                </div>

                <button
                  type="button"
                  onClick={() => selectedPlace && loadReviewsForPlace(selectedPlace.id)}
                  disabled={refreshingReviews}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
                >
                  <i className={`fa-solid fa-rotate ${refreshingReviews ? 'animate-spin text-emerald-600' : ''}`}></i>
                  <span>Làm mới</span>
                </button>
              </div>

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
                          <span className="text-amber-500 font-bold">★ {selectedPlace.ratingAvg?.toFixed(1) || '5.0'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Chọn một địa điểm...</span>
                  )}
                  <i
                    className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${
                      isDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  ></i>
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 max-h-80 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                    {places.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPlace(p);
                          setIsDropdownOpen(false);
                          loadReviewsForPlace(p.id);
                        }}
                        className={`p-3 rounded-2xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                          selectedPlace?.id === p.id ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{p.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              📍 {p.provinceName} • ★ {p.ratingAvg?.toFixed(1) || '5.0'}
                            </div>
                          </div>
                        </div>
                        {selectedPlace?.id === p.id && <i className="fa-solid fa-check text-emerald-600 text-xs"></i>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Danh sách nhận xét */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                    <i className="fa-solid fa-comments"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Danh Sách Đánh Giá ({reviews.length})</h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Đang xem của: <strong className="text-slate-700">{selectedPlace?.name}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mx-auto mb-3 text-2xl text-slate-300">
                    <i className="fa-solid fa-comment-slash"></i>
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Chưa có đánh giá nào</h4>
                  <p className="text-xs text-slate-400 mt-1">Địa điểm này hiện chưa nhận được phản hồi nào.</p>
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
          </div>
        )}
      </main>

      {/* 4. MODAL THÊM ĐỊA ĐIỂM DU LỊCH MỚI (ĐÃ ĐỔI 3 DROPDOWN SANG CUSTOM UI) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
                  <i className="fa-solid fa-plus"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Thêm Điểm Đến Mới</h3>
                  <span className="text-xs text-slate-400">Ghi dữ liệu trực tiếp vào bảng Places của CSDL</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreatePlaceSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Tên địa danh / Điểm đến *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Vườn Quốc Gia Cúc Phương"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* 3 CUSTOM DROPDOWNS: THỂ LOẠI - TỈNH THÀNH - VÙNG MIỀN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CustomSelect
                  label="Thể loại *"
                  value={formData.categoryId}
                  options={categoryOptions}
                  onChange={(val) => setFormData({ ...formData, categoryId: val })}
                />
                <CustomSelect
                  label="Tỉnh thành *"
                  value={formData.provinceId}
                  options={provinceOptions}
                  onChange={(val) => setFormData({ ...formData, provinceId: val })}
                />
                <CustomSelect
                  label="Vùng miền *"
                  value={formData.region}
                  options={REGION_OPTIONS}
                  onChange={(val) => setFormData({ ...formData, region: val })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Địa chỉ chi tiết *</label>
                  <input
                    type="text"
                    required
                    placeholder="Xã, Huyện, Tỉnh..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Chi phí vé vào (VNĐ - 0 là miễn phí)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Ví dụ: 80000"
                    value={formData.ticketPriceAvg}
                    onChange={(e) => setFormData({ ...formData, ticketPriceAvg: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Đường dẫn ảnh đại diện (URL)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                {formData.imageUrl && (
                  <div className="mt-2 h-28 w-full rounded-xl overflow-hidden border border-slate-200">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Bài viết cẩm nang & Mô tả tổng quan</label>
                <textarea
                  rows="3"
                  placeholder="Chia sẻ vẻ đẹp, nét độc đáo, cảnh sắc..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingPlace}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>{submittingPlace ? 'Đang lưu vào CSDL...' : 'Lưu Điểm Đến'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL CHỈNH SỬA ĐỊA ĐIỂM (ĐÃ ĐỔI 3 DROPDOWN SANG CUSTOM UI TONE AMBER) */}
      {editingPlace && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold">
                  <i className="fa-solid fa-pen-to-square"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Cập Nhật Thông Tin Điểm Đến</h3>
                  <span className="text-xs text-slate-400">
                    Đang chỉnh sửa: <strong>{editingPlace.name}</strong> (ID: #{editingPlace.id})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlace(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleUpdatePlaceSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Tên địa danh / Điểm đến *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {/* 3 CUSTOM DROPDOWNS: THỂ LOẠI - TỈNH THÀNH - VÙNG MIỀN CHO MODAL SỬA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CustomSelect
                  label="Thể loại *"
                  value={editFormData.categoryId}
                  options={categoryOptions}
                  onChange={(val) => setEditFormData({ ...editFormData, categoryId: val })}
                  theme="amber"
                />
                <CustomSelect
                  label="Tỉnh thành *"
                  value={editFormData.provinceId}
                  options={provinceOptions}
                  onChange={(val) => setEditFormData({ ...editFormData, provinceId: val })}
                  theme="amber"
                />
                <CustomSelect
                  label="Vùng miền *"
                  value={editFormData.region}
                  options={REGION_OPTIONS}
                  onChange={(val) => setEditFormData({ ...editFormData, region: val })}
                  theme="amber"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Địa chỉ chi tiết *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Chi phí vé vào (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editFormData.ticketPriceAvg}
                    onChange={(e) => setEditFormData({ ...editFormData, ticketPriceAvg: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Đường dẫn ảnh đại diện (URL)</label>
                <input
                  type="url"
                  value={editFormData.imageUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                {editFormData.imageUrl && (
                  <div className="mt-2 h-28 w-full rounded-xl overflow-hidden border border-slate-200">
                    <img src={editFormData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={editFormData.latitude}
                    onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={editFormData.longitude}
                    onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Bài viết cẩm nang & Mô tả tổng quan</label>
                <textarea
                  rows="3"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlace(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>{submittingEdit ? 'Đang cập nhật CSDL...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}