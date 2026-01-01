import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';
import roomApi from '../../api/roomApi';
import bookingApi from '../../api/bookingApi';
import { BASE_URL } from '../../components/home/constants';
import './roomDetail.css';
import socket from '../../utils/socket';
import moment from 'moment';
import voucherApi from '../../api/voucherApi';

// Hàm hỗ trợ định dạng tiền tệ VND
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(Math.floor(amount));
};

const RoomDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [bookingData, setBookingData] = useState({
        checkin_date: searchParams.get('checkin_date') || '',
        checkout_date: searchParams.get('checkout_date') || '',
        guests: Number(searchParams.get('guests')) || 1
    });
    const [paymentMethod, setPaymentMethod] = useState('online');

    const fetchRoom = async () => {
        try {
            const response = await roomApi.getById(id);
            setRoom(response.data);
        } catch (error) {
            console.error('Error fetching room:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoom();
    }, [id, bookingData.checkin_date, bookingData.checkout_date]);

    const handleBookingChange = (e) => {
        const { name, value } = e.target;
        setBookingData({
            ...bookingData,
            [name]: value
        });

        // Xóa lỗi xác thực khi người dùng thay đổi đầu vào
        setValidationError('');

        // Xác thực ngày tháng
        if (name === 'checkout_date' && bookingData.checkin_date) {
            const checkin = new Date(bookingData.checkin_date);
            const checkout = new Date(value);
            if (checkout <= checkin) {
                setValidationError('Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày');
            }
        }

        if (name === 'checkin_date' && bookingData.checkout_date) {
            const checkin = new Date(value);
            const checkout = new Date(bookingData.checkout_date);
            if (checkout <= checkin) {
                setValidationError('Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày');
            }
        }
    };

    const handleBooking = () => {
        // Thêm phòng hiện tại vào giỏ hàng (sessionStorage) kèm theo thông tin ngày và khách
        const saved = sessionStorage.getItem('selectedRooms');
        let selectedRooms = saved ? JSON.parse(saved) : [];

        // Tạo bản sao của room kèm theo thông tin đặt phòng
        const roomWithBookingData = {
            ...room,
            checkin_date: bookingData.checkin_date,
            checkout_date: bookingData.checkout_date,
            guests: bookingData.guests
        };

        // Kiểm tra xem phòng đã có trong giỏ hàng chưa
        const existingIndex = selectedRooms.findIndex(r => r.room_id === room.room_id);
        if (existingIndex !== -1) {
            // Cập nhật thông tin mới nhất
            selectedRooms[existingIndex] = roomWithBookingData;
        } else {
            selectedRooms.push(roomWithBookingData);
        }

        sessionStorage.setItem('selectedRooms', JSON.stringify(selectedRooms));
        // Phát sự kiện để Navbar cập nhật số lượng
        window.dispatchEvent(new Event('storage'));

        // Chuyển hướng sang trang thông tin đặt phòng
        message.success('Đã thêm phòng vào danh sách đặt. Vui lòng hoàn tất thông tin.');
        navigate('/booking');
    };


    const calculateTotalPrice = () => {
        if (!bookingData.checkin_date || !bookingData.checkout_date || !room) return 0;
        const start = new Date(bookingData.checkin_date);
        const end = new Date(bookingData.checkout_date);
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        let pricePerNight = room.roomType?.base_price || 0;
        let total = nights * pricePerNight;

        return Math.max(0, total);
    };

    if (loading) {
        return (
            <div className="loading-page">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="error-page">
                <h2>Không tìm thấy phòng</h2>
                <button onClick={() => navigate('/home')}>Quay lại trang chủ</button>
            </div>
        );
    }

    const roomImage = room.image?.startsWith('http')
        ? room.image
        : room.image
            ? `${BASE_URL}${room.image}`
            : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80';

    return (
        <div className="room-detail-page">
            <Navbar />

            <div className="room-detail-container">
                <button className="back-button" onClick={() => navigate('/home')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                    </svg>
                    Quay lại
                </button>

                <div className="room-content">
                    <div className="room-info-section">
                        <h1 className="room-title">
                            {room.roomType?.name || `Phòng ${room.room_number}`}
                        </h1>

                        <div className="room-meta">
                            <span className="room-number">Phòng số: {room.room_number}</span>
                            <span className="room-rating">
                                <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor">
                                    <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.54 1.736l7.293 6.815-1.991 9.692a1 1 0 0 0 1.488 1.081L16 24.248l8.64 4.808a1 1 0 0 0 1.488-1.08l-1.991-9.692 7.293-6.815a1 1 0 0 0-.54-1.736l-9.86-1.27-4.124-8.885a1 1 0 0 0-1.798 0z" />
                                </svg>
                                4.8 (128 đánh giá)
                            </span>
                        </div>

                        <div className="room-image-container">
                            <img src={roomImage} alt={room.room_number} className="room-image" />
                        </div>

                        <div className="room-details">
                            <h2>Thông tin phòng</h2>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    <div>
                                        <strong>Sức chứa</strong>
                                        <p>{room.roomType?.capacity || 2} khách</p>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <div>
                                        <strong>Trạng thái</strong>
                                        <p>{room.status === 'available' ? 'Còn trống' : 'Đã đặt'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="room-description">
                                <h3>Mô tả</h3>
                                <p>{room.roomType?.description || 'Phòng được trang bị đầy đủ tiện nghi hiện đại, không gian thoáng mát, view đẹp. Phù hợp cho gia đình hoặc nhóm bạn.'}</p>
                            </div>

                            <div className="amenities">
                                <h3>Tiện nghi</h3>
                                <div className="amenity-list">
                                    <div className="amenity-item">WiFi miễn phí</div>
                                    <div className="amenity-item">Điều hòa</div>
                                    <div className="amenity-item">TV màn hình phẳng</div>
                                    <div className="amenity-item">Tủ lạnh</div>
                                    <div className="amenity-item">Phòng tắm riêng</div>
                                    <div className="amenity-item">Dịch vụ phòng 24/7</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="booking-section">
                        <div className="booking-card">
                            <h3 className="reservation-title">Đặt ngay</h3>
                            <span className="price">{formatCurrency(room.roomType?.base_price || 0)}đ</span>
                            <span className="price-unit">/ đêm</span>

                            <div className="booking-form">
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Ngày nhận phòng</label>
                                        <input
                                            type="date"
                                            name="checkin_date"
                                            value={bookingData.checkin_date}
                                            onChange={handleBookingChange}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Ngày trả phòng</label>
                                        <input
                                            type="date"
                                            name="checkout_date"
                                            value={bookingData.checkout_date}
                                            onChange={handleBookingChange}
                                            min={bookingData.checkin_date || new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label>Số khách</label>
                                    <select
                                        name="guests"
                                        value={bookingData.guests}
                                        onChange={handleBookingChange}
                                    >
                                        {Array.from({ length: room.roomType?.capacity || 2 }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>{num} khách</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Phương thức thanh toán</label>
                                    <div className="payment-method-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default', fontWeight: 'normal' }}>
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value="online"
                                                checked={true}
                                                readOnly
                                            />
                                            <span>Thanh toán trực tuyến (VNPay)</span>
                                        </label>
                                    </div>
                                </div>

                                {validationError && (
                                    <div className="validation-error">
                                        {validationError}
                                    </div>
                                )}

                                {bookingData.checkin_date && bookingData.checkout_date && !validationError && (
                                    <div className="price-summary">
                                        <div className="price-summary-row">
                                            <span>Giá mỗi đêm:</span>
                                            <span>{formatCurrency(room.roomType?.base_price || 0)}đ</span>
                                        </div>
                                        <div className="price-summary-row">
                                            <span>Số đêm:</span>
                                            <span>{Math.ceil((new Date(bookingData.checkout_date) - new Date(bookingData.checkin_date)) / (1000 * 60 * 60 * 24))}</span>
                                        </div>
                                        <div className="price-summary-total">
                                            <span>Tổng cộng:</span>
                                            <span>{formatCurrency(calculateTotalPrice())}đ</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    className="book-button"
                                    onClick={handleBooking}
                                    disabled={isBooking}
                                    style={{
                                        backgroundColor: '#003580',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isBooking ? 'Đang xử lý...' : 'Đặt phòng ngay'}
                                </button>

                                <p className="booking-note">Thanh toán an toàn qua cổng VNPAY ở bước tiếp theo</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div >
    );
};

export default RoomDetail;
