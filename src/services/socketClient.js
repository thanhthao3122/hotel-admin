import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // Adjust based on env

class SocketClient {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                autoConnect: true
            });

            this.socket.on('connect', () => {
                console.log('Socket connected:', this.socket.id);
            });

            this.socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });
        }
        return this.socket;
    }

    getSocket() {
        if (!this.socket) {
            return this.connect();
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

const socketClient = new SocketClient();
export default socketClient;
