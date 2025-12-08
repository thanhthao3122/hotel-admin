// src/api/userApi.js
import axiosClient from './axiosClient';

const userApi = {
  // Lấy danh sách user có phân trang
  getAll(page = 1, limit = 10, extraParams = {}) {
    return axiosClient.get('/users', {
      params: {
        page,
        limit,
        ...extraParams,
      },
    });
  },

  // Lấy chi tiết 1 user
  getById(id) {
    return axiosClient.get(`/users/${id}`);
  },

  // Tạo user mới
  create(data) {
    // data: { full_name, email, password, phone }
    return axiosClient.post('/users', data);
  },

  // Cập nhật user
  update(id, data) {
    return axiosClient.put(`/users/${id}`, data);
  },

  // Xóa user
  delete(id) {
    return axiosClient.delete(`/users/${id}`);
  },

  // Dùng cho combobox (không cần phân trang, lấy nhiều bản ghi)
  getAllNoPaging() {
    return axiosClient.get('/users', {
      params: {
        page: 1,
        limit: 1000,
      },
    });
  },
};

export default userApi;
