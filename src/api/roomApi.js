// src/api/roomApi.js
import axiosClient from './axiosClient';

const roomApi = {
  getAll: (page = 1, limit = 10) => {
    return axiosClient.get('/rooms', {
      params: { page, limit },
    });
  },

  getById: (id) => {
    return axiosClient.get(`/rooms/${id}`);
  },

  create: (data) => {
    return axiosClient.post('/rooms', data);
  },

  update: (id, data) => {
    return axiosClient.put(`/rooms/${id}`, data);
  },

  updateStatus: (id, status) => {
    return axiosClient.patch(`/rooms/${id}/status`, { status });
  },

  delete: (id) => {
    return axiosClient.delete(`/rooms/${id}`);
  },

  getAvailable: (checkin_date, checkout_date) => {
    return axiosClient.get('/rooms/available', {
      params: { checkin_date, checkout_date },
    });
  },
};

export default roomApi;
