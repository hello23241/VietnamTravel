import apiClient from './apiClient';

export const travelApi = {
  // Xác thực
  login: (username, password) => 
    apiClient.post('/Auth/login', { username, password }),
    
  register: (username, password, fullname) => 
    apiClient.post('/Auth/register', { username, password, fullname }),

  // Danh mục & Tỉnh thành
  getCategories: () => 
    apiClient.get('/Categories'),

  getProvinces: (region) => 
    apiClient.get('/Provinces', { params: { region } }),

  // Địa điểm du lịch (hỗ trợ categoryId, provinceId, tuKhoa, sortBy)
  getPlaces: (params) => 
    apiClient.get('/Places', { params }),

  getPlaceDetail: (id) => 
    apiClient.get(`/Places/${id}`),

  getPlaceWeather: (id) => 
    apiClient.get(`/Places/${id}/weather`),

  // Sổ tay yêu thích
  toggleFavorite: (userId, placeId) => 
    apiClient.post('/Favorites/toggle', { userId, placeId }),

  getUserFavorites: (userId) => 
    apiClient.get(`/Favorites/user/${userId}`),

  // Đánh giá
  getReviews: (placeId) => 
    apiClient.get('/Reviews', { params: { placeId } }),

  addReview: (userId, placeId, rating, comment) => 
    apiClient.post('/Reviews', { userId, placeId, rating, comment }),
};