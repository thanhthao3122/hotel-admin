import { useState, useEffect } from 'react';
import { notification } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import socket from '../../utils/socket';

const BookingNotification = () => {
    useEffect(() => {
        const handleBookingCreated = (data) => {
            // Chỉ hiển thị nếu là người khác (tùy chọn: kiểm tra user_id nếu có)
            // Nhưng thường thì mọi booking đều là bằng chứng xã hội tốt

            notification.info({
                message: 'Có khách vừa đặt phòng!',
                description: `Một đơn đặt phòng mới vừa được thực hiện. Các phòng có thể đã thay đổi trạng thái sẵn sàng.`,
                placement: 'bottomRight',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                duration: 5,
            });
        };

        const handleRoomUpdated = (data) => {
            // trạng thái phòng thay đổi
            if (data.status === 'available') {
                notification.success({
                    message: 'Phòng trống mới!',
                    description: `Một phòng vừa mới trống và đã sẵn sàng phục vụ.`,
                    placement: 'bottomRight',
                    duration: 4,
                });
            }
        };

        socket.on('booking_created', handleBookingCreated);
        socket.on('room_status_updated', handleRoomUpdated);

        return () => {
            socket.off('booking_created', handleBookingCreated);
            socket.off('room_status_updated', handleRoomUpdated);
        };
    }, []);

    return null; // Component này không render gì cả
};

export default BookingNotification;
