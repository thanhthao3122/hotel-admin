import axiosClient from './axiosClient';

const bookingApi = {
    // Get all bookings with pagination and filters
    getAll: (page = 1, limit = 10, filters = {}) => {
        return axiosClient.get('/bookings', {
            params: { page, limit, ...filters }
        });
    },

    // Get booking by ID
    getById: (id) => {
        return axiosClient.get(`/bookings/${id}`);
    },

    // Create new booking
    create: (data) => {
        return axiosClient.post('/bookings', data);
    },

    // Update booking
    update: (id, data) => {
        return axiosClient.put(`/bookings/${id}`, data);
    },

    // Update booking status
    updateStatus: (id, status) => {
        return axiosClient.patch(`/bookings/${id}/status`, { status });
    },

    // Delete booking
    delete: (id) => {
        return axiosClient.delete(`/bookings/${id}`);
    },

    // Get bookings by user
    getByUser: (userId) => {
        return axiosClient.get(`/bookings/user/${userId}`);
    },

    // Get bookings by room
    getByRoom: (roomId) => {
        return axiosClient.get(`/bookings/room/${roomId}`);
    }
};

export default bookingApi;
