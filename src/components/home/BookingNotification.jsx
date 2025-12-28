import { useState, useEffect } from 'react';
import { notification } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import socket from '../../utils/socket';

const BookingNotification = () => {
    useEffect(() => {
        const handleBookingCreated = (data) => {
            // Only show if it's someone else (optional: check user_id if available)
            // But usually, any booking is good social proof

            notification.info({
                message: 'Có khách vừa đặt phòng!',
                description: `Một đơn đặt phòng mới vừa được thực hiện. Các phòng có thể đã thay đổi trạng thái sẵn sàng.`,
                placement: 'bottomRight',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                duration: 5,
            });
        };

        const handleRoomUpdated = (data) => {
            // room status changes
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

    return null; // This component doesn't render anything itself
};

export default BookingNotification;
