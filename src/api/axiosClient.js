import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// ❌ KHÔNG set Content-Type cứng ở đây nữa
// headers: { 'Content-Type': 'application/json' },

// Nếu gửi FormData thì bỏ Content-Type để browser tự set multipart
axiosClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // để browser tự gắn boundary
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API error:', error);
    throw error;
  }
);

export default axiosClient;
