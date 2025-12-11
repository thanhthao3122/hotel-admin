// src/api/serviceApi.js
import axiosClient from "./axiosClient";

const serviceApi = {
  // GET /services?page=&limit=
  getAll(page = 1, limit = 10) {
    // axiosClient đã trả về { success, data, pagination }
    return axiosClient.get("/services", {
      params: { page, limit },
    });
  },

  // GET /services/:id
  getById(id) {
    return axiosClient.get(`/services/${id}`);
  },

  // POST /services
  create(data) {
    return axiosClient.post("/services", data);
  },

  // PUT /services/:id
  update(id, data) {
    return axiosClient.put(`/services/${id}`, data);
  },

  // DELETE /services/:id
  delete(id) {
    return axiosClient.delete(`/services/${id}`);
  },
};

export default serviceApi;
