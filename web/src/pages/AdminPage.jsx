import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { travelApi, adminApi } from '../api/travelApi';

const REGION_OPTIONS = [
  { value: 'Bắc', label: 'Miền Bắc', icon: 'fa-mountain' },
  { value: 'Trung', label: 'Miền Trung', icon: 'fa-sun' },
  { value: 'Nam', label: 'Miền Nam', icon: 'fa-water' },
];

function CustomSelect({ label, value, options, onChange, placeholder, theme = 'emerald' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
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
        <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform ${open ? `rotate-180 ${checkColor}` : ''}`}></i>
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
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'places' | 'users' | 'reviews' | 'metadata'
  const [loading, setLoading] = useState(true);

  // 1. Dữ liệu Dashboard & Biểu đồ
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);

  // 2. Dữ liệu Quản lý Địa điểm
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [submittingPlace, setSubmittingPlace] = useState(false);
  const [placeFormData, setPlaceFormData] = useState({
    name: '', categoryId: '', provinceId: '', region: 'Bắc',
    address: '', ticketPriceAvg: 0, imageUrl: '', description: '',
    latitude: 21.0285, longitude: 105.8542,
  });

  // 3. Dữ liệu Quản lý Thành viên
  const [users, setUsers] = useState([]);
  const [userKeyword, setUserKeyword] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 4. Dữ liệu Kiểm duyệt Đánh giá
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewRatingFilter, setReviewRatingFilter] = useState('');
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // 5. Dữ liệu Tỉnh thành & Danh mục
  const [metaSubTab, setMetaSubTab] = useState('provinces'); // 'provinces' | 'categories'
  const [provinceName, setProvinceName] = useState('');
  const [provinceRegion, setProvinceRegion] = useState('Bắc');
  const [editingProvince, setEditingProvince] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('landscape');
  const [editingCategory, setEditingCategory] = useState(null);

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

  const initAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDashboardData(),
        loadPlacesData(),
        loadUsersData(),
        loadReviewsData(1, ''),
      ]);
    } catch (err) {
      console.error('Lỗi khởi tạo dữ liệu Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM TẢI DỮ LIỆU TỪNG MỤC ---
  const loadDashboardData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getChartStats(),
      ]);
      setStats(sRes);
      setCharts(cRes);
    } catch (e) {
      console.error('Lỗi load dashboard:', e);
    }
  };

  const loadPlacesData = async () => {
    try {
      const [pRes, catsRes, provsRes] = await Promise.all([
        travelApi.getPlaces({ pageSize: 100 }),
        travelApi.getCategories().catch(() => []),
        travelApi.getProvinces().catch(() => []),
      ]);
      setPlaces(pRes?.items || (Array.isArray(pRes) ? pRes : []));
      setCategories(catsRes || []);
      setProvinces(provsRes || []);

      if (catsRes?.length > 0 && provsRes?.length > 0) {
        setPlaceFormData((prev) => ({
          ...prev,
          categoryId: prev.categoryId || catsRes[0].id,
          provinceId: prev.provinceId || provsRes[0].id,
        }));
      }
    } catch (e) {
      console.error('Lỗi load places:', e);
    }
  };

  const loadUsersData = async (kw = '') => {
    try {
      setLoadingUsers(true);
      const res = await adminApi.getUsers(kw.trim() || undefined);
      setUsers(res || []);
    } catch (e) {
      console.error('Lỗi load users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadReviewsData = async (page = 1, star = reviewRatingFilter) => {
    try {
      setLoadingReviews(true);
      const res = await adminApi.getAllReviews({
        pageNumber: page,
        pageSize: 10,
        rating: star ? Number(star) : undefined,
      });
      setReviewsList(res?.items || []);
      setReviewPage(res?.pageNumber || 1);
      setReviewTotalPages(res?.totalPages || 1);
    } catch (e) {
      console.error('Lỗi load reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  // --- THAO TÁC NGƯỜI DÙNG (USERS) ---
  const handleDeleteUser = async (user) => {
    if (user.username === 'admin') {
      alert('Không thể xóa tài khoản Quản trị viên tối cao (admin)!');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${user.username}"?`)) return;

    try {
      await adminApi.deleteUser(user.id);
      alert(`Đã xóa tài khoản "${user.username}" thành công!`);
      loadUsersData(userKeyword);
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa người dùng');
    }
  };

  // --- THAO TÁC ĐÁNH GIÁ (REVIEWS) ---
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhận xét vi phạm này?')) return;
    try {
      await adminApi.deleteReview(reviewId);
      alert('Đã xóa đánh giá vi phạm và cân bằng lại điểm trung bình địa điểm!');
      loadReviewsData(reviewPage, reviewRatingFilter);
      loadDashboardData();
      loadPlacesData();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa đánh giá');
    }
  };

  // --- THAO TÁC ĐỊA ĐIỂM (PLACES) ---
  const handleSavePlaceSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingPlace(true);
      const isEdit = Boolean(editingPlace);
      const data = isEdit ? editingPlace : placeFormData;
      const payload = {
        name: data.name.trim(),
        categoryId: Number(data.categoryId),
        provinceId: Number(data.provinceId),
        region: data.region,
        address: data.address.trim(),
        ticketPriceAvg: Number(data.ticketPriceAvg) || 0,
        imageUrl: data.imageUrl.trim() || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
        description: data.description.trim(),
        latitude: Number(data.latitude) || 0,
        longitude: Number(data.longitude) || 0,
      };

      if (isEdit) {
        await travelApi.updatePlace(editingPlace.id, payload);
        alert(`Đã cập nhật địa điểm "${payload.name}" thành công!`);
        setEditingPlace(null);
      } else {
        await travelApi.createPlace(payload);
        alert(`Đã thêm địa điểm "${payload.name}" thành công vào CSDL!`);
        setIsAddPlaceModalOpen(false);
      }
      loadPlacesData();
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu địa điểm');
    } finally {
      setSubmittingPlace(false);
    }
  };

  const handleDeletePlace = async (placeId, placeName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa địa điểm "${placeName}"?`)) return;
    try {
      await travelApi.deletePlace(placeId);
      alert('Đã xóa địa điểm thành công!');
      loadPlacesData();
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa địa điểm');
    }
  };

  // --- THAO TÁC TỈNH THÀNH (PROVINCES) ---
  const handleSaveProvince = async (e) => {
    e.preventDefault();
    if (!provinceName.trim()) return;
    try {
      if (editingProvince) {
        await adminApi.updateProvince(editingProvince.id, { name: provinceName.trim(), region: provinceRegion });
        alert('Cập nhật tỉnh thành thành công!');
        setEditingProvince(null);
      } else {
        await adminApi.createProvince({ name: provinceName.trim(), region: provinceRegion });
        alert('Thêm tỉnh thành mới thành công!');
      }
      setProvinceName('');
      loadPlacesData();
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu tỉnh thành');
    }
  };

  const handleDeleteProvince = async (prov) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tỉnh/thành "${prov.name}"?`)) return;
    try {
      await adminApi.deleteProvince(prov.id);
      alert('Đã xóa tỉnh thành thành công!');
      loadPlacesData();
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa tỉnh thành');
    }
  };

  // --- THAO TÁC DANH MỤC (CATEGORIES) ---
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, { name: categoryName.trim(), iconUrl: categoryIcon });
        alert('Cập nhật danh mục thành công!');
        setEditingCategory(null);
      } else {
        await adminApi.createCategory({ name: categoryName.trim(), iconUrl: categoryIcon });
        alert('Thêm danh mục mới thành công!');
      }
      setCategoryName('');
      loadPlacesData();
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu danh mục');
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"?`)) return;
    try {
      await adminApi.deleteCategory(cat.id);
      alert('Đã xóa danh mục thành công!');
      loadPlacesData();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa danh mục');
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name, icon: 'fa-tags' }));
  const provinceOptions = provinces.map((p) => ({ value: p.id, label: p.name, icon: 'fa-location-dot' }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Đang chuẩn bị Bảng Điều Khiển Quản Trị...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 font-sans">
      {/* 1. HEADER BANNER */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors mb-3">
              <i className="fa-solid fa-arrow-left"></i> Quay lại trang chủ người dùng
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl shadow-lg">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Trung Tâm Quản Trị Hệ Thống</h1>
                <p className="text-xs text-slate-400 mt-0.5">Quản lý toàn diện dữ liệu du lịch, tài khoản thành viên và phân tích biểu đồ.</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md self-start md:self-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Quyền Quản Trị Viên</span>
            <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              @{currentUser?.username} ({currentUser?.fullname})
            </span>
          </div>
        </div>
      </section>

      {/* 2. THANH ĐIỀU HƯỚNG 5 TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl p-2 shadow-xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-chart-pie"></i>
            <span>Tổng Quan & Biểu Đồ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('places')}
            className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'places' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-map-location-dot"></i>
            <span>Điểm Đến ({places.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'users' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-users"></i>
            <span>Thành Viên ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'reviews' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-comments"></i>
            <span>Kiểm Duyệt Nhận Xét</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all col-span-2 sm:col-span-1 ${
              activeTab === 'metadata' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-layer-group"></i>
            <span>Tỉnh Thành & Thể Loại</span>
          </button>
        </div>
      </div>

      {/* 3. NỘI DUNG CHÍNH THEO TỪNG TAB */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* ============================================================== */}
        {/* TAB 1: TỔNG QUAN & BIỂU ĐỒ THỐNG KÊ (DASHBOARD STATS) */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 5 Thẻ Chỉ Số Tổng Quan */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                  <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Điểm Đến</span>
                  <span className="text-2xl font-black text-slate-900">{stats?.totalPlaces ?? places.length}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
                  <i className="fa-solid fa-users"></i>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Thành Viên</span>
                  <span className="text-2xl font-black text-slate-900">{stats?.totalUsers ?? users.length}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
                  <i className="fa-solid fa-comments"></i>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Đánh Giá</span>
                  <span className="text-2xl font-black text-slate-900">{stats?.totalReviews ?? 0}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl shrink-0">
                  <i className="fa-solid fa-city"></i>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Tỉnh Thành</span>
                  <span className="text-2xl font-black text-slate-900">{stats?.totalProvinces ?? provinces.length}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0">
                  <i className="fa-solid fa-star"></i>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Điểm Đánh Giá TB</span>
                  <span className="text-2xl font-black text-rose-600">{stats?.averageRating?.toFixed(1) ?? '5.0'} / 5.0</span>
                </div>
              </div>
            </div>

            {/* 3 Khối Biểu Đồ & Bảng Phân Tích */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Biểu đồ 1: Phân bổ địa điểm theo Vùng miền */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                    <i className="fa-solid fa-chart-pie text-emerald-600"></i> Phân Bổ Địa Điểm Theo Miền
                  </h3>
                  <p className="text-xs text-slate-400 mb-5">Thống kê tỷ lệ phân bổ trên cả nước</p>

                  <div className="space-y-4">
                    {(charts?.placesByRegion || []).map((item) => {
                      const total = stats?.totalPlaces || 1;
                      const percent = Math.round((item.count / total) * 100);
                      return (
                        <div key={item.region}>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>Miền {item.region}</span>
                            <span>{item.count} địa điểm ({percent}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Biểu đồ 2: Phân bổ đánh giá theo số sao (1 -> 5 sao) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                    <i className="fa-solid fa-star-half-stroke text-amber-500"></i> Phân Bổ Thang Điểm Đánh Giá
                  </h3>
                  <p className="text-xs text-slate-400 mb-5">Số lượng nhận xét theo thang 1 đến 5 sao</p>

                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = charts?.ratingDistribution?.[star] || 0;
                      const totalReviews = stats?.totalReviews || 1;
                      const percent = Math.round((count / totalReviews) * 100);
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs">
                          <span className="w-12 font-bold text-slate-700 shrink-0">{star} sao</span>
                          <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-400 h-full rounded-full transition-all duration-700"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="w-10 text-right font-semibold text-slate-500 shrink-0">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bảng 3: Top 5 điểm đến được yêu thích nhất */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                  <i className="fa-solid fa-heart text-rose-500"></i> Top 5 Điểm Đến Được Lưu Sổ Tay
                </h3>
                <p className="text-xs text-slate-400 mb-4">Các địa danh có lượt thả tim cao nhất</p>

                <div className="space-y-3">
                  {(charts?.topFavoritedPlaces || []).map((tp, idx) => (
                    <div key={tp.placeId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{tp.placeName}</div>
                          <div className="text-[10px] text-slate-400 truncate">📍 {tp.provinceName}</div>
                        </div>
                      </div>
                      <span className="text-xs font-black text-rose-500 flex items-center gap-1 shrink-0 ml-2">
                        <i className="fa-solid fa-heart text-[10px]"></i> {tp.favoriteCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: QUẢN LÝ ĐỊA ĐIỂM (PLACES CRUD) */}
        {/* ============================================================== */}
        {activeTab === 'places' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Danh Mục Tọa Độ Du Lịch</h3>
                <p className="text-xs text-slate-500 mt-0.5">Thêm mới, cập nhật kinh độ/vĩ độ hoặc gỡ bỏ điểm tham quan.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingPlace(null);
                  setIsAddPlaceModalOpen(true);
                }}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/25 shrink-0"
              >
                <i className="fa-solid fa-plus text-sm"></i>
                <span>Thêm Điểm Đến Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((p) => (
                <div key={p.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 flex gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">{p.region || 'Việt Nam'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-white">{p.categoryName}</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
                        <span>📍 {p.provinceName}</span>
                        <span className="text-amber-500 font-bold">★ {p.ratingAvg?.toFixed(1) || '5.0'}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{p.description || p.address}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700">
                        {p.ticketPriceAvg > 0 ? `${Number(p.ticketPriceAvg).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Link to={`/place/${p.id}`} className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors">
                          Xem
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlace(p);
                            setIsAddPlaceModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlace(p.id, p.name)}
                          className="p-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-xs font-bold transition-colors"
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

        {/* ============================================================== */}
        {/* TAB 3: QUẢN LÝ THÀNH VIÊN (USERS MANAGEMENT & DELETE) */}
        {/* ============================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Danh Sách Thành Viên ({users.length})</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quản lý tài khoản, theo dõi số bài đánh giá và gỡ bỏ người dùng vi phạm.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Tìm theo username, họ tên..."
                  value={userKeyword}
                  onChange={(e) => setUserKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsersData(userKeyword)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => loadUsersData(userKeyword)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
                >
                  Tìm
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {loadingUsers ? (
                <div className="p-12 text-center text-xs text-slate-400">Đang tải danh sách thành viên...</div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">Không tìm thấy thành viên nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3.5 px-5">Thành viên</th>
                        <th className="py-3.5 px-4">Tên đăng nhập</th>
                        <th className="py-3.5 px-4">Ngày đăng ký</th>
                        <th className="py-3.5 px-4">Đóng góp</th>
                        <th className="py-3.5 px-4">Vai trò</th>
                        <th className="py-3.5 px-5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => {
                        const isSuperAdmin = u.username.toLowerCase() === 'admin';
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullname)}`}
                                  alt={u.fullname}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                                <div>
                                  <div className="font-extrabold text-slate-900">{u.fullname}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">ID: #{u.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-700">@{u.username}</td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Mới tạo'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-2 text-slate-600 font-semibold">
                                <span title="Số đánh giá">💬 {u.totalReviews ?? 0}</span>
                                <span>•</span>
                                <span title="Số yêu thích">❤️ {u.totalFavorites ?? 0}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                isSuperAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {isSuperAdmin ? 'Quản trị viên' : 'Thành viên'}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              {isSuperAdmin ? (
                                <span className="text-[11px] text-slate-400 italic">Được bảo vệ</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl font-bold transition-all inline-flex items-center gap-1.5"
                                  title="Xóa tài khoản vi phạm"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                  <span>Xóa</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: KIỂM DUYỆT ĐÁNH GIÁ (CENTRAL REVIEWS & SPAM FILTER) */}
        {/* ============================================================== */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Trung Tâm Kiểm Duyệt Nhận Xét</h3>
                <p className="text-xs text-slate-500 mt-0.5">Lọc nhanh các bài đánh giá 1 sao để phát hiện và gỡ bỏ bình luận quảng cáo spam.</p>
              </div>

              {/* Bộ lọc số sao */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                <span className="text-slate-400 text-[11px] uppercase mr-1">Lọc sao:</span>
                {[
                  { value: '', label: 'Tất cả' },
                  { value: '1', label: '1★ (Spam)' },
                  { value: '2', label: '2★' },
                  { value: '3', label: '3★' },
                  { value: '4', label: '4★' },
                  { value: '5', label: '5★' },
                ].map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      setReviewRatingFilter(f.value);
                      loadReviewsData(1, f.value);
                    }}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      reviewRatingFilter === f.value
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {loadingReviews ? (
                <div className="p-12 text-center text-xs text-slate-400">Đang nạp các bài đánh giá...</div>
              ) : reviewsList.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mx-auto mb-3 text-2xl text-slate-300">
                    <i className="fa-solid fa-comment-slash"></i>
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Không tìm thấy đánh giá nào</h4>
                  <p className="text-xs text-slate-400 mt-1">Không có bình luận nào khớp với bộ lọc hiện tại.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-xs font-black text-slate-900">{rev.userFullname || rev.username}</span>
                          <span className="text-amber-500 font-bold text-xs flex items-center gap-1">
                            <i className="fa-solid fa-star"></i> {rev.rating} sao
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-emerald-700 font-bold text-xs">📍 {rev.placeName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-mono font-bold">
                            #{rev.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          "{rev.comment}"
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="self-end sm:self-center px-4 py-2 bg-rose-50 hover:bg-rose-600 border border-rose-200 text-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        <span>Xóa vi phạm</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Thanh Chuyển Trang (Pagination) */}
              {reviewTotalPages > 1 && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <button
                    type="button"
                    disabled={reviewPage <= 1}
                    onClick={() => loadReviewsData(reviewPage - 1, reviewRatingFilter)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40"
                  >
                    ← Trang trước
                  </button>
                  <span className="text-slate-500">Trang {reviewPage} / {reviewTotalPages}</span>
                  <button
                    type="button"
                    disabled={reviewPage >= reviewTotalPages}
                    onClick={() => loadReviewsData(reviewPage + 1, reviewRatingFilter)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40"
                  >
                    Trang sau →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: QUẢN LÝ TỈNH THÀNH & THỂ LOẠI (METADATA CRUD) */}
        {/* ============================================================== */}
        {activeTab === 'metadata' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Thanh chuyển đổi Tỉnh thành / Thể loại */}
            <div className="flex gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setMetaSubTab('provinces')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  metaSubTab === 'provinces' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white border text-slate-600'
                }`}
              >
                Quản Lý Tỉnh Thành ({provinces.length})
              </button>
              <button
                type="button"
                onClick={() => setMetaSubTab('categories')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  metaSubTab === 'categories' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white border text-slate-600'
                }`}
              >
                Quản Lý Danh Mục Thể Loại ({categories.length})
              </button>
            </div>

            {metaSubTab === 'provinces' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Thêm/Sửa Tỉnh */}
                <form onSubmit={handleSaveProvince} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 text-xs font-bold h-fit">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {editingProvince ? `Cập Nhật: ${editingProvince.name}` : 'Thêm Tỉnh/Thành Mới'}
                  </h4>
                  <div>
                    <label className="block text-slate-700 mb-1">Tên Tỉnh / Thành phố *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Ninh Bình"
                      value={provinceName}
                      onChange={(e) => setProvinceName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-normal outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">Vùng Miền *</label>
                    <select
                      value={provinceRegion}
                      onChange={(e) => setProvinceRegion(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-normal outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Bắc">Miền Bắc</option>
                      <option value="Trung">Miền Trung</option>
                      <option value="Nam">Miền Nam</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editingProvince && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProvince(null);
                          setProvinceName('');
                        }}
                        className="flex-1 py-2 rounded-xl border font-bold text-slate-600"
                      >
                        Hủy
                      </button>
                    )}
                    <button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700">
                      {editingProvince ? 'Lưu Thay Đổi' : 'Thêm Mới'}
                    </button>
                  </div>
                </form>

                {/* Danh sách Tỉnh thành */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
                  <h4 className="text-sm font-extrabold text-slate-900 mb-4">Danh Sách Tỉnh Thành Hiện Có</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {provinces.map((prov) => (
                      <div key={prov.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900">📍 {prov.name}</div>
                          <div className="text-[10px] text-slate-400">Miền: {prov.region} • {prov.totalPlaces || 0} điểm đến</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProvince(prov);
                              setProvinceName(prov.name);
                              setProvinceRegion(prov.region);
                            }}
                            className="p-1.5 px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProvince(prov)}
                            className="p-1.5 px-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Thêm/Sửa Danh Mục */}
                <form onSubmit={handleSaveCategory} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 text-xs font-bold h-fit">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {editingCategory ? `Cập Nhật: ${editingCategory.name}` : 'Thêm Thể Loại Mới'}
                  </h4>
                  <div>
                    <label className="block text-slate-700 mb-1">Tên Thể Loại / Trải Nghiệm *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Du lịch sinh thái"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-normal outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">Mã Icon (Tùy chọn)</label>
                    <input
                      type="text"
                      value={categoryIcon}
                      onChange={(e) => setCategoryIcon(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-normal outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryName('');
                        }}
                        className="flex-1 py-2 rounded-xl border font-bold text-slate-600"
                      >
                        Hủy
                      </button>
                    )}
                    <button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700">
                      {editingCategory ? 'Lưu Thay Đổi' : 'Thêm Mới'}
                    </button>
                  </div>
                </form>

                {/* Danh sách Danh Mục */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
                  <h4 className="text-sm font-extrabold text-slate-900 mb-4">Danh Sách Thể Loại Hiện Có</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map((cat) => (
                      <div key={cat.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900">🏷️ {cat.name}</div>
                          <div className="text-[10px] text-slate-400">ID: #{cat.id}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryName(cat.name);
                              setCategoryIcon(cat.iconUrl || 'tag');
                            }}
                            className="p-1.5 px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 px-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4. MODAL THÊM / CHỈNH SỬA ĐỊA ĐIỂM DU LỊCH */}
      {isAddPlaceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
                  <i className={`fa-solid ${editingPlace ? 'fa-pen-to-square' : 'fa-plus'}`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {editingPlace ? 'Cập Nhật Thông Tin Điểm Đến' : 'Thêm Điểm Đến Mới'}
                  </h3>
                  <span className="text-xs text-slate-400">Đồng bộ trực tiếp vào cơ sở dữ liệu SQLite</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddPlaceModalOpen(false);
                  setEditingPlace(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSavePlaceSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Tên địa danh / Điểm đến *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Quần Thể Tràng An"
                  value={editingPlace ? editingPlace.name : placeFormData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingPlace) setEditingPlace({ ...editingPlace, name: val });
                    else setPlaceFormData({ ...placeFormData, name: val });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-normal text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CustomSelect
                  label="Thể loại *"
                  value={editingPlace ? editingPlace.categoryId : placeFormData.categoryId}
                  options={categoryOptions}
                  onChange={(val) => {
                    if (editingPlace) setEditingPlace({ ...editingPlace, categoryId: val });
                    else setPlaceFormData({ ...placeFormData, categoryId: val });
                  }}
                />
                <CustomSelect
                  label="Tỉnh thành *"
                  value={editingPlace ? editingPlace.provinceId : placeFormData.provinceId}
                  options={provinceOptions}
                  onChange={(val) => {
                    if (editingPlace) setEditingPlace({ ...editingPlace, provinceId: val });
                    else setPlaceFormData({ ...placeFormData, provinceId: val });
                  }}
                />
                <CustomSelect
                  label="Vùng miền *"
                  value={editingPlace ? editingPlace.region : placeFormData.region}
                  options={REGION_OPTIONS}
                  onChange={(val) => {
                    if (editingPlace) setEditingPlace({ ...editingPlace, region: val });
                    else setPlaceFormData({ ...placeFormData, region: val });
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Địa chỉ chi tiết *</label>
                  <input
                    type="text"
                    required
                    placeholder="Xã, Huyện, Tỉnh..."
                    value={editingPlace ? editingPlace.address : placeFormData.address}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editingPlace) setEditingPlace({ ...editingPlace, address: val });
                      else setPlaceFormData({ ...placeFormData, address: val });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-normal text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Chi phí vé vào (VNĐ - 0 là miễn phí)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editingPlace ? editingPlace.ticketPriceAvg : placeFormData.ticketPriceAvg}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editingPlace) setEditingPlace({ ...editingPlace, ticketPriceAvg: val });
                      else setPlaceFormData({ ...placeFormData, ticketPriceAvg: val });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-normal text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Đường dẫn ảnh đại diện (URL)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editingPlace ? editingPlace.imageUrl : placeFormData.imageUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingPlace) setEditingPlace({ ...editingPlace, imageUrl: val });
                    else setPlaceFormData({ ...placeFormData, imageUrl: val });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-normal text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingPlace ? editingPlace.latitude : placeFormData.latitude}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editingPlace) setEditingPlace({ ...editingPlace, latitude: val });
                      else setPlaceFormData({ ...placeFormData, latitude: val });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-normal text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingPlace ? editingPlace.longitude : placeFormData.longitude}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editingPlace) setEditingPlace({ ...editingPlace, longitude: val });
                      else setPlaceFormData({ ...placeFormData, longitude: val });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-normal text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Mô tả cẩm nang điểm đến</label>
                <textarea
                  rows="3"
                  placeholder="Giới thiệu cảnh sắc, trải nghiệm nổi bật..."
                  value={editingPlace ? editingPlace.description : placeFormData.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingPlace) setEditingPlace({ ...editingPlace, description: val });
                    else setPlaceFormData({ ...placeFormData, description: val });
                  }}
                  className="w-full p-3 bg-slate-50 border rounded-xl font-normal text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddPlaceModalOpen(false);
                    setEditingPlace(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingPlace}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold flex items-center gap-2 shadow-md"
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>{submittingPlace ? 'Đang lưu vào CSDL...' : 'Lưu Điểm Đến'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}