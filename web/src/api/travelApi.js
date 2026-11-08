import apiClient from './apiClient';

// Hàm bóc tách dữ liệu an toàn: tự động nhận diện nếu apiClient đã bóc sẵn data
const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

export const travelApi = {
  loginWithGoogle: async (idToken) => {
    const res = await apiClient.post('/Auth/google', { idToken });
    return unwrap(res);
  },

  // 2. Danh mục (Categories)
  getCategories: async () => {
    const res = await apiClient.get('/Categories');
    return unwrap(res);
  },

  // 3. Tỉnh thành theo Vùng miền (Provinces)
  getProvinces: async (region) => {
    const res = await apiClient.get('/Provinces', {
      params: region ? { region } : {},
    });
    return unwrap(res);
  },
  getProvinceDetail: async (id) => {
    const res = await apiClient.get(`/Provinces/${id}`);
    return unwrap(res);
  },

  // 4. Danh sách & Quản lý Địa điểm (Places CRUD)
  getPlaces: async ({ region, categoryId, provinceId, sortBy, tuKhoa, pageNumber = 1, pageSize = 50 } = {}) => {
    const res = await apiClient.get('/Places', {
      params: {
        region: region && region !== 'all' ? region : undefined,
        categoryId,
        provinceId,
        sortBy,
        tuKhoa,
        pageNumber,
        pageSize,
      },
    });
    return unwrap(res);
  },
  getPlaceDetail: async (id) => {
    const res = await apiClient.get(`/Places/${id}`);
    return unwrap(res);
  },
  getPlaceWeather: async (id) => {
    const res = await apiClient.get(`/Places/${id}/weather`);
    return unwrap(res);
  },
  createPlace: async (data) => unwrap(await apiClient.post('/Places', data)),
  updatePlace: async (id, data) => unwrap(await apiClient.put(`/Places/${id}`, data)),
  deletePlace: async (id) => unwrap(await apiClient.delete(`/Places/${id}`)),

  // 5. Đánh giá (Reviews)
  getReviews: async (placeId) => {
    const res = await apiClient.get('/Reviews', {
      params: { placeId },
    });
    return unwrap(res);
  },
  addReview: async (userId, placeId, rating, comment) => {
    const res = await apiClient.post('/Reviews', {
      userId: Number(userId),
      placeId: Number(placeId),
      rating: Number(rating),
      comment,
    });
    return unwrap(res);
  },
  deleteReview: async (id) => {
    const res = await apiClient.delete(`/Reviews/${id}`);
    return unwrap(res);
  },

  // 6. Sổ tay Yêu thích (Favorites)
  getUserFavorites: async (userId) => {
    const res = await apiClient.get(`/Favorites/user/${userId}`);
    return unwrap(res);
  },
  toggleFavorite: async (userId, placeId) => {
    const res = await apiClient.post('/Favorites/toggle', {
      userId: Number(userId),
      placeId: Number(placeId),
    });
    return unwrap(res);
  },
};

export const adminApi = {
  // 1. Thống kê & Biểu đồ
  getDashboardStats: async () => unwrap(await apiClient.get('/Admin/dashboard-stats')),
  getChartStats: async () => unwrap(await apiClient.get('/Admin/chart-stats')),

  // 2. Quản lý Địa điểm (Places CRUD)
  createPlace: async (data) => unwrap(await apiClient.post('/Places', data)),
  updatePlace: async (id, data) => unwrap(await apiClient.put(`/Places/${id}`, data)),
  deletePlace: async (id) => unwrap(await apiClient.delete(`/Places/${id}`)),

  // 3. Quản lý Người dùng
  getUsers: async (tuKhoa) => unwrap(await apiClient.get('/Admin/users', { params: { tuKhoa } })),
  deleteUser: async (id) => unwrap(await apiClient.delete(`/Admin/users/${id}`)),

  // 4. Kiểm duyệt Đánh giá
  getAllReviews: async ({ placeId, rating, pageNumber = 1, pageSize = 20 } = {}) =>
    unwrap(await apiClient.get('/Admin/reviews', { params: { placeId, rating, pageNumber, pageSize } })),
  deleteReview: async (id) => unwrap(await apiClient.delete(`/Admin/reviews/${id}`)),

  // 5. Quản lý Tỉnh thành & Danh mục
  createProvince: async (data) => unwrap(await apiClient.post('/Admin/provinces', data)),
  updateProvince: async (id, data) => unwrap(await apiClient.put(`/Admin/provinces/${id}`, data)),
  deleteProvince: async (id) => unwrap(await apiClient.delete(`/Admin/provinces/${id}`)),

  createCategory: async (data) => unwrap(await apiClient.post('/Admin/categories', data)),
  updateCategory: async (id, data) => unwrap(await apiClient.put(`/Admin/categories/${id}`, data)),
  deleteCategory: async (id) => unwrap(await apiClient.delete(`/Admin/categories/${id}`)),
};