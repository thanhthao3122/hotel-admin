import axiosClient from './axiosClient';

const voucherApi = {
    getAll: (params) => {
        return axiosClient.get('/vouchers', { params });
    },
    validate: (code) => {
        return axiosClient.get(`/vouchers/validate/${code}`);
    },
    getByCode: (code) => {
        return axiosClient.get(`/vouchers/code/${code}`);
    },
    create: (data) => {
        return axiosClient.post('/vouchers', data);
    },
    update: (id, data) => {
        return axiosClient.put(`/vouchers/${id}`, data);
    },
    delete: (id) => {
        return axiosClient.delete(`/vouchers/${id}`);
    }
};

export default voucherApi;
