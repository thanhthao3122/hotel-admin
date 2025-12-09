import axiosClient from './axiosClient';

const serviceUsageApi = {
    // Get all service usages with pagination
    getAll: (page = 1, limit = 10) => {
        return axiosClient.get('/service-usage', {
            params: { page, limit }
        });
    },

    // Get service usage by ID
    getById: (id) => {
        return axiosClient.get(`/service-usage/${id}`);
    },

    // Create new service usage
    create: (data) => {
        return axiosClient.post('/service-usage', data);
    },

    // Update service usage
    update: (id, data) => {
        return axiosClient.put(`/service-usage/${id}`, data);
    },

    // Delete service usage
    delete: (id) => {
        return axiosClient.delete(`/service-usage/${id}`);
    },

    // Get service usages by booking
    getByBooking: (bookingId) => {
        return axiosClient.get(`/service-usage/booking/${bookingId}`);
    },

    // User request service (requires auth)
    requestService: (data) => {
        return axiosClient.post('/service-usage/request', data);
    },

    // Get user's service history (requires auth)
    getMyHistory: () => {
        return axiosClient.get('/service-usage/my-history');
    },

    // Get user's active booking (requires auth)
    getMyBooking: () => {
        return axiosClient.get('/service-usage/my-booking');
    }
};

export default serviceUsageApi;
