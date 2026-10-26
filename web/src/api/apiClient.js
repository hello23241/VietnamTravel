import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5128/api';

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
    const data = error.response?.data;
    let message = '';

    if (typeof data === 'string') {
      message = data;
    } else if (data?.message) {
      message = data.message;
    } else if (data?.errors && typeof data.errors === 'object') {
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