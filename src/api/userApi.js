
import axiosClient from './axiosClient';

const userApi = {
  // Get all users with pagination
  getAll: (page = 1, limit = 10) => {
    return axiosClient.get('/users', {
      params: { page, limit }
    });
  },

  // Get user by ID
  getById: (id) => {
    return axiosClient.get(`/users/${id}`);
  },

  // Create new user
  create: (data) => {
    return axiosClient.post('/users', data);
  },

  // Update user
  update: (id, data) => {
    return axiosClient.put(`/users/${id}`, data);
  },

  // Delete user
  delete: (id) => {
    return axiosClient.delete(`/users/${id}`);
  },

  // Get users by role
  getByRole: (role) => {
    return axiosClient.get('/users', {
      params: { role }
    });
  }


};

export default userApi;
