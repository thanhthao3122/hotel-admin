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
    getById: (id) => axiosClient.get(`/payments/${id}`)
};

export default paymentApi;
