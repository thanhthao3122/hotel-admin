
import axiosClient from './axiosClient';

const paymentApi = {
    // Admin functions
    create: (data) => axiosClient.post('/payments', data),
    getAll: (page = 1, limit = 10) => axiosClient.get('/payments', { params: { page, limit } }),

    // User functions
    createPaymentUrl: (data) => axiosClient.post('/payments/create-url', data),
    getMyPayments: () => axiosClient.get('/payments/my-payments'),

    // Common functions
    getByBooking: (bookingId) => axiosClient.get(`/payments/booking/${bookingId}`),
    getStats: (year) => axiosClient.get('/payments/stats', { params: { year } }),
    getById: (id) => axiosClient.get(`/payments/${id}`),
    delete: (id) => axiosClient.delete(`/payments/${id}`)

};

export default paymentApi;
