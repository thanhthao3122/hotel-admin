import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, DatePicker, Button, Select, Divider, message, List, Space, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';
import bookingApi from '../../api/bookingApi';
import voucherApi from '../../api/voucherApi';
import './home.css';

const { Title, Text } = Typography;
const { Option } = Select;

const Booking = () => {
    const navigate = useNavigate();
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('pay_later');
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const saved = sessionStorage.getItem('selectedRooms');
        if (saved) {
            const rooms = JSON.parse(saved).map(r => ({
                ...r,
                checkin_date: r.checkin_date || dayjs().format('YYYY-MM-DD'),
                checkout_date: r.checkout_date || dayjs().add(1, 'day').format('YYYY-MM-DD')
            }));
            setSelectedRooms(rooms);
        }
    }, []);

    const calculateTotal = () => {
        let totalBase = selectedRooms.reduce((sum, room) => {
            const checkin = dayjs(room.checkin_date);
            const checkout = dayjs(room.checkout_date);
            const nights = checkout.diff(checkin, 'day');
            const price = room.roomType?.base_price || room.price_per_night || 0;
            return sum + (price * (nights > 0 ? nights : 0));
        }, 0);

        if (appliedVoucher) {
            if (appliedVoucher.discount_type === 'percentage') {
                totalBase -= totalBase * (parseFloat(appliedVoucher.discount_value) / 100);
            } else if (appliedVoucher.discount_type === 'fixed') {
                totalBase = Math.max(0, totalBase - parseFloat(appliedVoucher.discount_value));
            }
        }

        return Math.floor(totalBase);
    };

    const handleRoomDateChange = (roomId, dates) => {
        if (!dates || dates.length < 2) return;
        const newList = selectedRooms.map(r => {
            if (r.room_id === roomId) {
                return {
                    ...r,
                    checkin_date: dates[0].format('YYYY-MM-DD'),
                    checkout_date: dates[1].format('YYYY-MM-DD')
                };
            }
            return r;
        });
        setSelectedRooms(newList);
        sessionStorage.setItem('selectedRooms', JSON.stringify(newList));
    };

    const handleApplyVoucher = async () => {
        if (!voucherCode) return;
        try {
            setIsValidatingVoucher(true);
            const response = await voucherApi.getByCode(voucherCode);
            setAppliedVoucher(response.data);
            message.success('Đã áp dụng mã giảm giá!');
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ');
            setAppliedVoucher(null);
        } finally {
            setIsValidatingVoucher(false);
        }
    };

    const handleRemoveRoom = (id) => {
        const newList = selectedRooms.filter(r => r.room_id !== id);
        setSelectedRooms(newList);
        sessionStorage.setItem('selectedRooms', JSON.stringify(newList));
        window.dispatchEvent(new Event('storage'));
        if (newList.length === 0) {
            message.info('Giỏ hàng trống, quay lại trang chủ');
            navigate('/home');
        }
    };

    const handleBooking = async () => {
        if (!user) {
            message.warning('Vui lòng đăng nhập để đặt phòng');
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            // Calculate overall min/max dates for the booking header
            const checkin_dates = selectedRooms.map(r => dayjs(r.checkin_date));
            const checkout_dates = selectedRooms.map(r => dayjs(r.checkout_date));
            const minCheckin = checkin_dates.reduce((m, d) => d.isBefore(m) ? d : m);
            const maxCheckout = checkout_dates.reduce((m, d) => d.isAfter(m) ? d : m);

            const payload = {
                user_id: user.user_id,
                checkin_date: minCheckin.format('YYYY-MM-DD'),
                checkout_date: maxCheckout.format('YYYY-MM-DD'),
                payment_method: paymentMethod,
                source: 'client',
                voucher_code: appliedVoucher?.code || null,
                rooms: selectedRooms.map(room => ({
                    room_id: room.room_id,
                    checkin_date: room.checkin_date,
                    checkout_date: room.checkout_date,
                    price_per_night: room.roomType?.base_price || room.price_per_night
                }))
            };

            const res = await bookingApi.create(payload);
            message.success('Đặt phòng thành công!');
            sessionStorage.removeItem('selectedRooms');
            window.dispatchEvent(new Event('storage'));

            if (paymentMethod === 'online' && res.data.paymentUrl) {
                window.location.href = res.data.paymentUrl;
            } else {
                navigate('/booking-history');
            }
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt phòng');
        } finally {
            setLoading(false);
        }
    };


    if (selectedRooms.length === 0) {
        return (
            <div className="landing-page">
                <Navbar />
                <main className="main-content" style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <Title level={3}>Giỏ hàng của bạn đang trống</Title>
                    <Text type="secondary">Vui lòng quay lại trang chủ để chọn phòng bạn ưng ý.</Text>
                    <div style={{ marginTop: '24px' }}>
                        <Button type="primary" size="large" onClick={() => navigate('/home')} style={{ backgroundColor: '#003580' }}>
                            Quay lại trang chủ
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="landing-page">
            <Navbar />
            <main className="main-content" style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
                <Title level={2}>Thông tin đặt phòng</Title>
                <Row gutter={24}>
                    {/* Cột trái: Danh sách phòng */}
                    <Col xs={24} lg={14}>
                        <Card title="Danh sách phòng đã chọn" bordered={false} className="shadow-sm">
                            <List
                                itemLayout="vertical"
                                dataSource={selectedRooms}
                                renderItem={item => (
                                    <List.Item
                                        key={item.room_id}
                                        extra={
                                            <Button danger type="link" onClick={() => handleRemoveRoom(item.room_id)}>Xóa</Button>
                                        }
                                    >
                                        <List.Item.Meta
                                            title={<Text strong style={{ fontSize: '16px' }}>Phòng {item.room_number} - {item.roomType?.name}</Text>}
                                            description={
                                                <Space direction="vertical" style={{ width: '100%', marginTop: '8px' }}>
                                                    <Text type="secondary">{parseInt(item.roomType?.base_price || item.price_per_night).toLocaleString('vi-VN')} VNĐ / đêm</Text>
                                                    <div style={{ marginTop: '4px' }}>
                                                        <Text strong size="small">Thời gian ở cho phòng này:</Text>
                                                        <DatePicker.RangePicker
                                                            style={{ width: '100%', marginTop: '4px' }}
                                                            format="DD/MM/YYYY"
                                                            value={[dayjs(item.checkin_date), dayjs(item.checkout_date)]}
                                                            onChange={(val) => handleRoomDateChange(item.room_id, val)}
                                                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                                                        />
                                                    </div>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>

                    {/* Cột phải: Thông tin đơn hàng */}
                    <Col xs={24} lg={10}>
                        <Card title="Chi tiết đơn hàng" bordered={false} className="shadow-sm">
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>

                                {/* Display Aggregated Dates */}
                                {selectedRooms.length > 0 && (() => {
                                    const checkins = selectedRooms.map(r => dayjs(r.checkin_date));
                                    const checkouts = selectedRooms.map(r => dayjs(r.checkout_date));
                                    const min = checkins.reduce((m, d) => d.isBefore(m) ? d : m);
                                    const max = checkouts.reduce((m, d) => d.isAfter(m) ? d : m);
                                    return (
                                        <div style={{ background: '#f0f5ff', padding: '12px', borderRadius: '6px', border: '1px solid #adc6ff' }}>
                                            <Text strong style={{ display: 'block', marginBottom: '4px' }}>Thời gian lưu trú (Toàn bộ):</Text>
                                            <Space split={<Divider type="vertical" />}>
                                                <Text>Nhận: <Text strong>{min.format('DD/MM/YYYY')}</Text></Text>
                                                <Text>Trả: <Text strong>{max.format('DD/MM/YYYY')}</Text></Text>
                                            </Space>
                                            <div style={{ marginTop: '4px' }}>
                                                <Text type="secondary">Tổng số đêm: {max.diff(min, 'day')} đêm</Text>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <Divider style={{ margin: '12px 0' }} />

                                <div>
                                    <Text type="secondary">Phương thức thanh toán:</Text>
                                    <Select
                                        style={{ width: '100%', marginTop: '8px' }}
                                        value={paymentMethod}
                                        onChange={setPaymentMethod}
                                    >
                                        <Option value="pay_later">Thanh toán tại quầy</Option>
                                        <Option value="online">Thanh toán trực tuyến (VNPay)</Option>
                                    </Select>
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                <div>
                                    <Text type="secondary">Mã giảm giá (Voucher):</Text>
                                    <Space.Compact style={{ width: '100%', marginTop: '8px' }}>
                                        <input
                                            type="text"
                                            className="ant-input"
                                            placeholder="NHẬP MÃ VOUCHER..."
                                            value={voucherCode}
                                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                            disabled={appliedVoucher || isValidatingVoucher}
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                        {appliedVoucher ? (
                                            <Button danger onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }}>Gỡ</Button>
                                        ) : (
                                            <Button type="primary" onClick={handleApplyVoucher} loading={isValidatingVoucher} disabled={!voucherCode}>
                                                Áp dụng
                                            </Button>
                                        )}
                                    </Space.Compact>
                                    {appliedVoucher && (
                                        <div style={{ marginTop: '8px', color: '#52c41a' }}>
                                            ✓ Đã giảm: {appliedVoucher.discount_type === 'percentage' ? appliedVoucher.discount_value + '%' : appliedVoucher.discount_value.toLocaleString('vi-VN') + ' VNĐ'}
                                        </div>
                                    )}
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={{ fontSize: '18px' }}>Tổng cộng:</Text>
                                    <Text type="danger" strong style={{ fontSize: '22px' }}>
                                        {calculateTotal().toLocaleString('vi-VN')} VNĐ
                                    </Text>
                                </div>

                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    onClick={handleBooking}
                                    loading={loading}
                                    style={{ height: '50px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#003580' }}
                                >
                                    Xác nhận đặt phòng
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </main>
            <Footer />
        </div>
    );
};

export default Booking;
