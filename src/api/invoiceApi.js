import axiosClient from "./axiosClient";

const invoiceApi = {
  // Get all invoices with pagination
  getAll: (page = 1, limit = 10) => {
    return axiosClient.get("/invoices", {
      params: { page, limit },
    });
  },

  // Get invoice by ID
  getById: (id) => {
    return axiosClient.get(`/invoices/${id}`);
  },

  // Create new invoice
  create: (data) => {
    return axiosClient.post("/invoices", data);
  },

  // Update invoice
  update: (id, data) => {
    return axiosClient.put(`/invoices/${id}`, data);
  },

  // Delete invoice
  delete: (id) => {
    return axiosClient.delete(`/invoices/${id}`);
  },

  // Get invoices by booking
  getByBooking: (bookingId) => {
    return axiosClient.get(`/invoices/booking/${bookingId}`);
  },

  // Update invoice status
  updateStatus: (id, status) => {
    return axiosClient.put(`/invoices/${id}/status`, { status });
  },
  // Refund invoice,
  refund: (id, data) => {
    return axiosClient.put(`/invoices/${id}/refund`, data);
  },
};

export default invoiceApi;
