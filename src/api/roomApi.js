// src/api/roomApi.js
import axiosClient from "./axiosClient";

const roomApi = {
  // ✅ getAll cho phép truyền thêm filters (vd: { status: 'booked' }) và ngày lọc
  getAll: (page = 1, limit = 10, filters = {}, date = null) => {
    return axiosClient.get("/rooms", {
      params: { page, limit, ...filters, date },
    });
  },

  getById: (id, extraParams = {}) => {
    return axiosClient.get(`/rooms/${id}`, {
      params: { ...extraParams }
    });
  },

  // 🟢 create & update nhận FormData (có file ảnh)
  create: (formData) => {
    return axiosClient.post("/rooms", formData);
  },

  update: (id, formData) => {
    return axiosClient.put(`/rooms/${id}`, formData);
  },

  updateStatus: (id, status) => {
    return axiosClient.patch(`/rooms/${id}/status`, { status });
  },

  delete: (id) => {
    return axiosClient.delete(`/rooms/${id}`);
  },

  getAvailable: (params) => {
    return axiosClient.get("/rooms/available", {
      params,
    });
  },
};

export default roomApi;
