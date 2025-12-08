// src/api/paymentApi.js
import axiosClient from "./axiosClient";

const paymentApi = {
  // Lấy thống kê theo năm
  getStats(year) {
    return axiosClient.get("/payments/stats", {
      params: { year },
    });
  },

  // (tùy sau dùng) lấy list payment
  getAll(page = 1, limit = 10) {
    return axiosClient.get("/payments", {
      params: { page, limit },
    });
  },
};

export default paymentApi;
