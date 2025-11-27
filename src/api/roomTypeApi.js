// src/api/roomTypeApi.js
import axiosClient from './axiosClient';

const roomTypeApi = {
  // Lấy danh sách loại phòng có phân trang
  getAll: (page = 1, limit = 10) => {
    return axiosClient.get('/room-types', {  //http://localhost:5000/api/room-types
      params: { page, limit },                      
    });
  },
// Lấy danh sách loại phòng đang trạng thái
  getActive: () => {
    return axiosClient.get('/room-types/active');
  },
// Lấy chi tiết 1 loại phòng theo id
  getById: (id) => {
    return axiosClient.get(`/room-types/${id}`);
  },
// Tạo mới loại phòng
  create: (data) => {
    return axiosClient.post('/room-types', data);
  },
 // Cập nhật loại phòng
  update: (id, data) => {
    return axiosClient.put(`/room-types/${id}`, data);
  },
// Xóa loại phòng
  delete: (id) => {
    return axiosClient.delete(`/room-types/${id}`);
  },
};

export default roomTypeApi;
