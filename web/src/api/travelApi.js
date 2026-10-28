import apiClient from './apiClient';

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

export const travelApi = {
  // 1. Xác thực (Auth)
  login: async (username, password) => {
    const res = await apiClient.post('/Auth/login', { username, password });
    return unwrap(res);
  },
  register: async (username, password, fullname) => {
    const res = await apiClient.post('/Auth/register', { username, password, fullname });
    return unwrap(res);
  },

  // 2. Danh mục (Categories)
  getCategories: async () => {
    const res = await apiClient.get('/Categories');
    return unwrap(res);
  },

  // 3. Tỉnh thành (Provinces)
  getProvinces: async (region) => {
    const res = await apiClient.get('/Provinces', {
      params: region ? { region } : {},
    });
    return unwrap(res);
  },
  // Lấy chi tiết thông tin tỉnh/thành phố theo Id
  getProvinceDetail: async (id) => {
    const res = await apiClient.get(`/Provinces/${id}`);
    return unwrap(res);
  },

  // 4. Danh sách & Quản trị Địa điểm (Places)
  getPlaces: async ({ categoryId, provinceId, sortBy, tuKhoa, page = 1, pageSize = 50 } = {}) => {
    const res = await apiClient.get('/Places', {
      params: { categoryId, provinceId, sortBy, tuKhoa, page, pageSize },
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
  createPlace: async (placeData) => {
    const res = await apiClient.post('/Places', placeData);
    return unwrap(res);
  },
  // Cập nhật thông tin địa điểm theo Id (PUT /api/Places/{id})
  updatePlace: async (id, placeData) => {
    const res = await apiClient.put(`/Places/${id}`, placeData);
    return unwrap(res);
  },
  deletePlace: async (id) => {
    const res = await apiClient.delete(`/Places/${id}`);
    return unwrap(res);
  },

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