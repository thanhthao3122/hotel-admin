import { useState, useEffect } from 'react';
import { Card, Typography, message, Spin, Button, Tag, Input, Form, Popconfirm } from 'antd';
import { CreditCardOutlined, CalendarOutlined, HomeOutlined, UserOutlined, MailOutlined, PhoneOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Navbar from '../../components/home/Navbar';
import SubNavbar from '../../components/home/SubNavbar';
import Footer from '../../components/home/Footer';
import bookingApi from '../../api/bookingApi';
import paymentApi from '../../api/paymentApi';
import './BookingHistory.css';
import socket from '../../utils/socket';

const { Title, Text } = Typography;

// Helper function to calculate totals
const calculateBookingDetails = (booking) => {
    if (!booking) return { nights: 0, roomTotal: 0, serviceTotal: 0, grandTotal: 0 };

    const checkin = new Date(booking.checkin_date);
    const checkout = new Date(booking.checkout_date);
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));

    // Calculate room total
    const roomTotal = booking.bookingRooms?.reduce((sum, br) => {
        const pricePerNight = parseFloat(br.price_per_night || 0);
        return sum + (pricePerNight * nights);
    }, 0) || 0;

    // Calculate service total
    const serviceTotal = booking.services?.reduce((sum, service) => {
        const usageData = service.ServiceUsage || {};
        return sum + parseFloat(usageData.total_price || 0);
    }, 0) || 0;

    const grandTotal = roomTotal + serviceTotal;

    return { nights, roomTotal, serviceTotal, grandTotal };
};

const getStatusConfig = (status) => {
    const statusMap = {
        'pending': { color: 'orange', text: 'Chờ xác nhận', icon: '⏳' },
        'confirmed': { color: 'cyan', text: 'Chờ nhận phòng', icon: '🏨' },
        'checked_in': { color: 'green', text: 'Đã nhận phòng', icon: '🛌' },
        'checked_out': { color: 'purple', text: 'Đã trả phòng', icon: '👋' },
        'paid': { color: 'blue', text: 'Đã thanh toán', icon: '💳' },
        'cancelled': { color: 'red', text: 'Đã hủy', icon: '❌' }
    };
    return statusMap[status] || { color: 'default', text: status, icon: '❓' };
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

// Sub-component: BookingCard
const BookingCard = ({ booking, isSelected, onClick, onCancel, cancelling }) => {
    const { nights, grandTotal } = calculateBookingDetails(booking);
    const isPaid = booking.payments?.some(p => p.status === 'completed');
    const statusConfig = getStatusConfig(booking.status, isPaid);
    // Chỉ cho phép hủy khi đang chờ xác nhận hoặc đã xác nhận (chưa nhận phòng) VÀ chưa thanh toán
    const canCancel = ['pending', 'confirmed'].includes(booking.status) && !isPaid;

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
                        {booking.bookingRooms && booking.bookingRooms.length > 0 ? (
                            booking.bookingRooms.map(br => (
                                <div key={br.room_id}>
                                    <Text strong>{br.room?.roomType?.name}</Text>
                                    <Text type="secondary"> - Phòng {br.room?.room_number}</Text>
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
                            onCancel(booking.booking_id);
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

// Sub-component: PaymentForm
const PaymentForm = ({ booking, user, onPayment, paying }) => {
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
    const isPaid = booking.payments?.some(p => p.status === 'completed');
    const statusConfig = getStatusConfig(booking.status, isPaid);
    const canPay = booking.status === 'pending';

    // Check if there is any pending payment - BUT user wants to ignore "Processing" state
    // const pendingPayment = booking.payments?.find(p => p.status === 'pending');
    const isProcessing = false; // !!pendingPayment && booking.status === 'pending';

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
                            value={user.name || user.username || user.full_name}
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
                                {booking.bookingRooms?.map(br => (
                                    <div key={br.room_id}>
                                        {br.room?.roomType?.name} - Phòng {br.room?.room_number}
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
                        {/* List services explicitly if needed */}
                        {booking.services && booking.services.length > 0 && (
                            <div className="services-list" style={{ paddingLeft: '20px', fontSize: '0.9em', color: '#666' }}>
                                {booking.services.map((service, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>- {service.name} (x{service.ServiceUsage?.quantity})</span>
                                        <span>{parseFloat(service.ServiceUsage?.total_price).toLocaleString('vi-VN')} VNĐ</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="price-divider"></div>
                        <div className="price-row total">
                            <Text strong className="total-label">Tổng cộng:</Text>
                            <Text strong className="total-amount">{grandTotal.toLocaleString('vi-VN')} VNĐ</Text>
                        </div>
                    </div>
                </div>

                {/* Nút thanh toán */}
                {canPay ? (
                    isProcessing ? (
                        <Button
                            type="default"
                            size="large"
                            block
                            icon={<Spin />}
                            disabled
                            className="payment-button processing"
                            style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: 'white', opacity: 0.8 }}
                        >
                            Đang xử lý thông tin...
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            size="large"
                            block
                            icon={<CreditCardOutlined />}
                            onClick={() => onPayment(booking.booking_id)}
                            loading={paying}
                            className="payment-button"
                        >
                            Thanh toán online
                        </Button>
                    )
                ) : (
                    <Button
                        type="primary"
                        size="large"
                        block
                        icon={<CheckCircleOutlined />}
                        disabled
                        className="payment-button success"
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white', opacity: 1 }}
                    >
                        {['confirmed', 'checked_in', 'checked_out', 'paid'].includes(booking.status) ? 'Thanh toán thành công' : 'Không thể thanh toán'}
                    </Button>
                )}
            </Form>
        </Card>
    );
};

const BookingHistory = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [paying, setPaying] = useState(false);
    const [cancelling, setCancelling] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));

    const fetchBookings = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const response = await bookingApi.getByUser(user.user_id);
            const allBookings = response.data || [];
            setBookings(allBookings);
            if (allBookings.length > 0 && !selectedBooking) {
                setSelectedBooking(allBookings[0]);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            message.error('Không thể tải lịch sử đặt phòng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();

        socket.on('booking_updated', (data) => {
            if (data.user_id === user?.user_id || !data.user_id) {
                fetchBookings();
                message.info('Thông tin đặt phòng vừa được cập nhật');
            }
        });

        socket.on('payment_received', () => {
            fetchBookings();
            message.success('Thanh toán thành công!');
        });

        return () => {
            socket.off('booking_updated');
            socket.off('payment_received');
        };
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
                                        onCancel={handleCancelBooking}
                                        cancelling={cancelling}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Cột phải - Form thanh toán */}
                        <div className="payment-form-container">
                            <PaymentForm
                                booking={selectedBooking}
                                user={user}
                                onPayment={handlePayment}
                                paying={paying}
                            />
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default BookingHistory;
