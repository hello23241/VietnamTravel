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

  // Địa điểm
  getPlaces: (params) => 
    apiClient.get('/Places', { params }), // params: { categoryId, provinceId, tuKhoa, sortBy, pageNumber, pageSize }

  getPlaceDetail: (id) => 
    apiClient.get(`/Places/${id}`),

  getPlaceWeather: (id) => 
    apiClient.get(`/Places/${id}/weather`),

  // Tương tác
  toggleFavorite: (userId, placeId) => 
    apiClient.post('/Favorites/toggle', { userId, placeId }),

  getUserFavorites: (userId) => 
    apiClient.get(`/Favorites/user/${userId}`),

  getReviews: (placeId) => 
    apiClient.get('/Reviews', { params: { placeId } }),

  addReview: (userId, placeId, rating, comment) => 
    apiClient.post('/Reviews', { userId, placeId, rating, comment }),
};