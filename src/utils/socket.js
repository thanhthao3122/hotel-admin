import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // Phù hợp với BACKEND_URL

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true
});

// Log khi kết nối thành công (để dễ debug cho đồ án)
socket.on("connect", () => {
    console.log("✅ Đã kết nối Real-time (Socket.io) ID:", socket.id);
});

socket.on("disconnect", () => {
    console.log("❌ Mất kết nối Real-time");
});

export default socket;
