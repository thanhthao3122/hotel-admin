import { useState, useEffect } from 'react';
import { Card, Typography, message, Spin, Button, Tag, Input, Form, Popconfirm } from 'antd';
import { CreditCardOutlined, CalendarOutlined, HomeOutlined, UserOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Navbar from '../../components/home/Navbar';
import SubNavbar from '../../components/home/SubNavbar';
import Footer from '../../components/home/Footer';
import bookingApi from '../../api/bookingApi';
import paymentApi from '../../api/paymentApi';
import './BookingHistory.css';

const { Title, Text } = Typography;

const BookingHistory = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [paying, setPaying] = useState(false);
    const [cancelling, setCancelling] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        const fetchBookings = async () => {
            try {
                const response = await bookingApi.getByUser(user.user_id);
                const validBookings = response.data.filter(b => b.status !== 'cancelled') || [];

                // Debug: Log booking data to see structure
                console.log('=== BOOKING DATA DEBUG ===');
                console.log('First booking:', validBookings[0]);
                console.log('Booking fields:', validBookings[0] ? Object.keys(validBookings[0]) : 'No bookings');
                if (validBookings[0]) {
                    console.log('total_price:', validBookings[0].total_price);
                    console.log('bookingRooms:', validBookings[0].bookingRooms);
                    console.log('rooms:', validBookings[0].rooms);
                }

                setBookings(validBookings);

                // Auto-select first booking if available
                if (validBookings.length > 0) {
                    setSelectedBooking(validBookings[0]);
                }
            } catch (error) {
                console.error('Error fetching bookings:', error);
                message.error('Không thể tải lịch sử đặt phòng');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const handlePayment = async (bookingId) => {
        try {
            setPaying(true);
            const response = await paymentApi.createPaymentUrl({ booking_id: bookingId });
            window.location.href = response.data.paymentUrl;
        } catch (error) {
            console.error('Error creating payment:', error);
            message.error(error.response?.data?.message || 'Không thể tạo link thanh toán');
        } finally {
            setPaying(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        try {
            setCancelling(bookingId);
            await bookingApi.updateStatus(bookingId, 'cancelled');
            message.success('Đã hủy booking thành công');

            // Refresh booking list
            const response = await bookingApi.getByUser(user.user_id);
            const validBookings = response.data.filter(b => b.status !== 'cancelled') || [];
            setBookings(validBookings);

            // If the cancelled booking was selected, clear selection
            if (selectedBooking?.booking_id === bookingId) {
                setSelectedBooking(validBookings.length > 0 ? validBookings[0] : null);
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            message.error(error.response?.data?.message || 'Không thể hủy booking');
        } finally {
            setCancelling(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[date.getDay()];
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${dayName}, ${day}/${month}/${year}`;
    };

    const calculateBookingDetails = (booking) => {
        if (!booking) return { nights: 0, roomTotal: 0, serviceTotal: 0, grandTotal: 0 };

        const checkin = new Date(booking.checkin_date);
        const checkout = new Date(booking.checkout_date);
        const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));

        console.log('=== PAYMENT CALCULATION DEBUG ===');
        console.log('Booking ID:', booking.booking_id);
        console.log('Nights:', nights);
        console.log('BookingRooms data:', booking.bookingRooms);
        console.log('Services data:', booking.services);

        // Calculate room total from bookingRooms (tổng tiền TẤT CẢ các phòng)
        const roomTotal = booking.bookingRooms?.reduce((sum, br, index) => {
            const pricePerNight = parseFloat(br.price_per_night || 0);
            const roomCost = pricePerNight * nights;
            console.log(`Room ${index + 1}: ${pricePerNight} VNĐ/đêm × ${nights} đêm = ${roomCost} VNĐ`);
            return sum + roomCost;
        }, 0) || 0;

        console.log('TỔNG TIỀN PHÒNG:', roomTotal, 'VNĐ');

        // Calculate service total from services (tổng tiền TẤT CẢ các dịch vụ)
        const serviceTotal = booking.services?.reduce((sum, service, index) => {
            // ServiceUsage data is in the junction table
            const usageData = service.ServiceUsage || {};
            const servicePrice = parseFloat(usageData.total_price || 0);
            console.log(`Service ${index + 1} (${service.service_name || 'Unknown'}): ${servicePrice} VNĐ`);
            return sum + servicePrice;
        }, 0) || 0;

        console.log('TỔNG TIỀN DỊCH VỤ:', serviceTotal, 'VNĐ');

        const grandTotal = roomTotal + serviceTotal;
        console.log('TỔNG CỘNG:', grandTotal, 'VNĐ');
        console.log('=================================');

        return { nights, roomTotal, serviceTotal, grandTotal };
    };

    const getStatusConfig = (status) => {
        const statusMap = {
            'pending': { color: 'orange', text: 'Chờ xác nhận', icon: '⏳' },
            'confirmed': { color: 'cyan', text: 'Đã xác nhận', icon: '📋' },
            'checked_in': { color: 'green', text: 'Đã nhận phòng', icon: '🏨' },
            'checked_out': { color: 'purple', text: 'Đã trả phòng', icon: '🚪' },
            'paid': { color: 'blue', text: 'Đã thanh toán', icon: '💳' },
            'cancelled': { color: 'red', text: 'Đã hủy', icon: '❌' }
        };
        return statusMap[status] || { color: 'default', text: status, icon: '❓' };
    };

    const BookingCard = ({ booking, isSelected, onClick }) => {
        const { nights, grandTotal } = calculateBookingDetails(booking);
        const statusConfig = getStatusConfig(booking.status);
        const canCancel = ['pending', 'confirmed'].includes(booking.status);

        return (
            <Card
                className={`booking-card ${isSelected ? 'selected' : ''}`}
                onClick={onClick}
                hoverable
            >
                <div className="booking-card-header">
                    <Text strong className="booking-id">#{booking.booking_id}</Text>
                    <Tag color={statusConfig.color} className="status-tag">
                        {statusConfig.icon} {statusConfig.text}
                    </Tag>
                </div>

                <div className="booking-card-body">
                    <div className="booking-info-row">
                        <HomeOutlined className="info-icon" />
                        <div className="info-content">
                            {booking.rooms && booking.rooms.length > 0 ? (
                                booking.rooms.map(room => (
                                    <div key={room.room_id}>
                                        <Text strong>{room.roomType?.name}</Text>
                                        <Text type="secondary"> - Phòng {room.room_number}</Text>
                                    </div>
                                ))
                            ) : (
                                <Text type="secondary">Không có thông tin phòng</Text>
                            )}
                        </div>
                    </div>

                    <div className="booking-info-row">
                        <CalendarOutlined className="info-icon" />
                        <div className="info-content">
                            <Text>{new Date(booking.checkin_date).toLocaleDateString('vi-VN')} - {new Date(booking.checkout_date).toLocaleDateString('vi-VN')}</Text>
                            <Text type="secondary"> ({nights} đêm)</Text>
                        </div>
                    </div>

                    <div className="booking-total">
                        <Text type="secondary">Tổng tiền:</Text>
                        <Text strong className="total-price">{grandTotal.toLocaleString('vi-VN')} VNĐ</Text>
                    </div>

                    {canCancel && (
                        <Popconfirm
                            title="Hủy booking"
                            description="Bạn có chắc chắn muốn hủy booking này?"
                            onConfirm={(e) => {
                                e.stopPropagation();
                                handleCancelBooking(booking.booking_id);
                            }}
                            okText="Có"
                            cancelText="Không"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                loading={cancelling === booking.booking_id}
                                onClick={(e) => e.stopPropagation()}
                                className="cancel-booking-btn"
                                block
                                style={{ marginTop: '12px' }}
                            >
                                Hủy booking
                            </Button>
                        </Popconfirm>
                    )}
                </div>
            </Card>
        );
    };

    const PaymentForm = ({ booking }) => {
        if (!booking) {
            return (
                <Card className="payment-form-card empty">
                    <div className="empty-state">
                        <CreditCardOutlined className="empty-icon" />
                        <Title level={4}>Chọn booking để thanh toán</Title>
                        <Text type="secondary">Vui lòng chọn một booking từ danh sách bên trái</Text>
                    </div>
                </Card>
            );
        }

        const { nights, roomTotal, serviceTotal, grandTotal } = calculateBookingDetails(booking);
        const statusConfig = getStatusConfig(booking.status);
        const canPay = booking.status !== 'paid' && booking.status !== 'cancelled';

        return (
            <Card className="payment-form-card">
                <div className="payment-form-header">
                    <CreditCardOutlined className="payment-icon" />
                    <Title level={3}>Chi tiết thanh toán</Title>
                </div>

                <Form layout="vertical" className="payment-form">
                    {/* Thông tin khách hàng */}
                    <div className="form-section">
                        <Title level={5} className="section-title">
                            <UserOutlined /> Thông tin khách hàng
                        </Title>

                        <Form.Item label="Tên khách hàng">
                            <Input
                                value={user.name || user.username}
                                readOnly
                                prefix={<UserOutlined />}
                            />
                        </Form.Item>

                        <Form.Item label="Email">
                            <Input
                                value={user.email}
                                readOnly
                                prefix={<MailOutlined />}
                            />
                        </Form.Item>

                        <Form.Item label="Số điện thoại">
                            <Input
                                value={user.phone || 'Chưa cập nhật'}
                                readOnly
                                prefix={<PhoneOutlined />}
                            />
                        </Form.Item>
                    </div>

                    {/* Thông tin đặt phòng */}
                    <div className="form-section">
                        <Title level={5} className="section-title">
                            <HomeOutlined /> Thông tin đặt phòng
                        </Title>

                        <div className="booking-details">
                            <div className="detail-row">
                                <Text strong>Mã booking:</Text>
                                <Text>#{booking.booking_id}</Text>
                            </div>
                            <div className="detail-row">
                                <Text strong>Trạng thái:</Text>
                                <Tag color={statusConfig.color}>
                                    {statusConfig.icon} {statusConfig.text}
                                </Tag>
                            </div>
                            <div className="detail-row">
                                <Text strong>Phòng:</Text>
                                <div>
                                    {booking.rooms?.map(room => (
                                        <div key={room.room_id}>
                                            {room.roomType?.name} - Phòng {room.room_number}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ngày tháng */}
                    <div className="form-section">
                        <Title level={5} className="section-title">
                            <CalendarOutlined /> Thời gian lưu trú
                        </Title>

                        <Form.Item label="Ngày nhận phòng">
                            <Input
                                value={formatDate(booking.checkin_date)}
                                readOnly
                                prefix={<CalendarOutlined />}
                                className="date-input"
                            />
                        </Form.Item>

                        <Form.Item label="Ngày trả phòng">
                            <Input
                                value={formatDate(booking.checkout_date)}
                                readOnly
                                prefix={<CalendarOutlined />}
                                className="date-input"
                            />
                        </Form.Item>

                        <div className="nights-info">
                            <CheckCircleOutlined className="check-icon" />
                            <Text strong>{nights} đêm lưu trú</Text>
                        </div>
                    </div>

                    {/* Chi tiết giá */}
                    <div className="form-section price-section">
                        <Title level={5} className="section-title">
                            💰 Chi tiết thanh toán
                        </Title>

                        <div className="price-breakdown">
                            <div className="price-row">
                                <Text>🏨 Tiền phòng ({nights} đêm):</Text>
                                <Text strong>{roomTotal.toLocaleString('vi-VN')} VNĐ</Text>
                            </div>
                            <div className="price-row">
                                <Text>🍽️ Dịch vụ sử dụng:</Text>
                                <Text strong>{serviceTotal.toLocaleString('vi-VN')} VNĐ</Text>
                            </div>
                            <div className="price-divider"></div>
                            <div className="price-row total">
                                <Text strong className="total-label">Tổng cộng:</Text>
                                <Text strong className="total-amount">{grandTotal.toLocaleString('vi-VN')} VNĐ</Text>
                            </div>
                        </div>
                    </div>

                    {/* Nút thanh toán */}
                    {canPay ? (
                        <Button
                            type="primary"
                            size="large"
                            block
                            icon={<CreditCardOutlined />}
                            onClick={() => handlePayment(booking.booking_id)}
                            loading={paying}
                            className="payment-button"
                        >
                            Thanh toán online
                        </Button>
                    ) : (
                        <div className="paid-notice">
                            <CheckCircleOutlined className="paid-icon" />
                            <Text strong>
                                {booking.status === 'paid' ? 'Đã thanh toán' : 'Không thể thanh toán'}
                            </Text>
                        </div>
                    )}
                </Form>
            </Card>
        );
    };

    return (
        <div className="landing-page">
            <div className="header-container">
                <Navbar />
                <SubNavbar />
            </div>

            <main className="booking-history-main">
                <div className="page-header">
                    <Title level={2}>Lịch sử đặt phòng & Thanh toán</Title>
                    <Text type="secondary">Quản lý booking và thanh toán trực tuyến</Text>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <Spin size="large" />
                        <p>Đang tải danh sách booking...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <Card className="empty-card">
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <h3>Chưa có booking nào</h3>
                            <p>Bạn chưa có booking nào. Hãy đặt phòng ngay!</p>
                            <Button type="primary" href="/" size="large">
                                Đặt phòng ngay
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="booking-history-layout">
                        {/* Cột trái - Danh sách bookings */}
                        <div className="bookings-list">
                            <div className="list-header">
                                <Title level={4}>Lịch sử đặt phòng</Title>
                                <Text type="secondary">{bookings.length} booking</Text>
                            </div>
                            <div className="cards-container">
                                {bookings.map(booking => (
                                    <BookingCard
                                        key={booking.booking_id}
                                        booking={booking}
                                        isSelected={selectedBooking?.booking_id === booking.booking_id}
                                        onClick={() => setSelectedBooking(booking)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Cột phải - Form thanh toán */}
                        <div className="payment-form-container">
                            <PaymentForm booking={selectedBooking} />
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default BookingHistory;
