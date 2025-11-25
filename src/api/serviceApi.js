// src/api/serviceApi.js
import axiosClient from './axiosClient';

const serviceApi = {
  getAll: (page = 1, limit = 10) => {
    return axiosClient.get('/services', {
      params: { page, limit },
    });
  },

  getById: (id) => {
    return axiosClient.get(`/services/${id}`);
  },

  create: (data) => {
    return axiosClient.post('/services', data);
  },

  update: (id, data) => {
    return axiosClient.put(`/services/${id}`, data);
  },

  delete: (id) => {
    return axiosClient.delete(`/services/${id}`);
  },
};

export default serviceApi;
