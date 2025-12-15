// src/api/authApi.js
import axiosClient from "./axiosClient";

const authApi = {
    // Lấy thông tin profile người dùng hiện tại
    getProfile: () => {
        return axiosClient.get("/auth/profile");
    },

    // Cập nhật thông tin profile
    updateProfile: (data) => {
        return axiosClient.put("/auth/profile", data);
    },

    // Đổi mật khẩu
    changePassword: (data) => {
        return axiosClient.post("/auth/change-password", data);
    },
};

export default authApi;
