// src/api/roomTypeApi.js
import axiosClient from './axiosClient';

const roomTypeApi = {
  getAll: (page = 1, limit = 10) => {
    return axiosClient.get('/room-types', {
      params: { page, limit },
    });
  },

  getActive: () => {
    return axiosClient.get('/room-types/active');
  },

  getById: (id) => {
    return axiosClient.get(`/room-types/${id}`);
  },

  create: (data) => {
    return axiosClient.post('/room-types', data);
  },

  update: (id, data) => {
    return axiosClient.put(`/room-types/${id}`, data);
  },

  delete: (id) => {
    return axiosClient.delete(`/room-types/${id}`);
  },
};

export default roomTypeApi;
