import apiClient from './apiClient';

// Hàm bóc tách dữ liệu an toàn: tự động nhận diện nếu apiClient đã bóc sẵn data
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

  // 3. Tỉnh thành theo Vùng miền (Provinces)
  getProvinces: async (region) => {
    const res = await apiClient.get('/Provinces', {
      params: region ? { region } : {},
    });
    return unwrap(res);
  },

  // 4. Danh sách Địa điểm (Places)
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