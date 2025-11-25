// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // 👈 sửa lại nếu backend bạn khác
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor response: luôn trả về response.data
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // có thể log lỗi ở đây
    console.error('API error:', error);
    // ném lại để chỗ gọi .catch được
    throw error;
  }
);

export default axiosClient;
