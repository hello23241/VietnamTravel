import axios from 'axios';

// Luôn ưu tiên 10.0.2.2 cho máy ảo Android
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5128/api';

console.log('📡 Đang kết nối API tới:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.log('🔴 LỖI GỌI API:');
    console.log('- Endpoint:', error.config?.url);
    console.log('- Full URL:', (error.config?.baseURL || '') + (error.config?.url || ''));
    console.log('- Message:', error.message);

    const data = error.response?.data;
    let message = '';

    if (typeof data === 'string') {
      message = data;
    } else if (data?.message) {
      message = data.message;
    } else if (data?.errors && typeof data.errors === 'object') {
      // Trích xuất câu lỗi đầu tiên trong mảng validation của ASP.NET Core
      const errorKeys = Object.keys(data.errors);
      if (errorKeys.length > 0) {
        const firstError = data.errors[errorKeys[0]];
        message = Array.isArray(firstError) ? firstError[0] : String(firstError);
      }
    }

    if (!message) {
      message = data?.title || error.message || 'Lỗi kết nối máy chủ';
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;