// src/pages/UserServiceRequest.jsx
import { useState, useEffect } from "react";
import {
    Card,
    Row,
    Col,
    Button,
    InputNumber,
    Table,
    Tag,
    message,
    Statistic,
    Descriptions,
    Space,
    Empty,
    Spin,
    Select
} from "antd";
import {
    ShoppingCartOutlined,
    HistoryOutlined,
    HomeOutlined,
    CalendarOutlined,
    DollarOutlined
} from "@ant-design/icons";

import Navbar from "../components/home/Navbar";
import SubNavbar from "../components/home/SubNavbar";
import serviceUsageApi from "../api/serviceUsageApi";
import serviceApi from "../api/serviceApi";
import paymentApi from "../api/paymentApi";
import socket from "../utils/socket";

const UserServiceRequest = () => {
    const [services, setServices] = useState([]);
    const [activeBookings, setActiveBookings] = useState([]);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [serviceHistory, setServiceHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const [quantities, setQuantities] = useState({});

    const fetchData = async () => {
        try {
            setLoading(true);
            const [servicesRes, bookingRes, historyRes] = await Promise.all([
                serviceApi.getAll(1, 100),
                serviceUsageApi.getMyBooking(),
                serviceUsageApi.getMyHistory()
            ]);

            console.log('=== DEBUG SERVICE REQUEST ===');
            console.log('Services:', servicesRes.data);
            console.log('Active Bookings:', bookingRes.data);

            setServices(servicesRes.data || []);
            const bookings = bookingRes.data || [];
            setActiveBookings(bookings);

            // Auto-select first booking if available and no selection yet
            if (bookings.length > 0 && !selectedBookingId) {
                setSelectedBookingId(bookings[0].booking_id);
            }

            setServiceHistory(historyRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            // Don't show error for services - we want to show them anyway
            if (!error.response || error.response.config.url.includes('/services')) {
                // Silently fail for services
            } else {
                message.error("Không tải được dữ liệu");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Real-time: Refresh if service added or invoice updated
        socket.on('invoice_updated', (data) => {
            if (data.booking_id == selectedBookingId || !selectedBookingId) {
                fetchData();
            }
        });

        socket.on('service_added', (data) => {
            if (data.booking_id == selectedBookingId || !selectedBookingId) {
                fetchData();
            }
        });

        socket.on('payment_received', (data) => {
            if (data.booking_id == selectedBookingId || !selectedBookingId) {
                fetchData();
            }
        });

        return () => {
            socket.off('invoice_updated');
            socket.off('service_added');
            socket.off('payment_received');
        };
    }, [selectedBookingId]);

    const handleRequestService = async (serviceId) => {
        const quantity = quantities[serviceId] || 1;

        if (quantity < 1) {
            message.warning("Số lượng phải lớn hơn 0");
            return;
        }

        // Check if user has selected a booking
        if (!selectedBookingId) {
            message.warning({
                content: "Vui lòng đặt phòng và check in để gọi dịch vụ",
                duration: 5
            });
            return;
        }

        try {
            setRequesting(true);
            await serviceUsageApi.requestService({
                booking_id: selectedBookingId,
                service_id: serviceId,
                quantity
            });
            message.success("Gọi dịch vụ thành công!");

            // Reset quantity
            setQuantities({ ...quantities, [serviceId]: 1 });

            // Refresh EVERYTHING
            await fetchData();
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || "Không thể gọi dịch vụ";
            message.error(errorMsg);
        } finally {
            setRequesting(false);
        }
    };
    const getSelectedBookingFinancials = () => {
        if (!selectedBookingId || !activeBookings) return null;
        const booking = activeBookings.find(b => b.booking_id === selectedBookingId);
        return booking?.financials || null;
    };

    const financials = getSelectedBookingFinancials();
    const remainingAmount = financials?.remainingAmount || 0;
    const totalPaid = financials?.totalPaid || 0;

    const [paymentLoading, setPaymentLoading] = useState(false);

    const handlePayment = async () => {
        if (!selectedBookingId) {
            message.warning("Vui lòng chọn phòng để thanh toán");
            return;
        }

        if (remainingAmount <= 0) {
            message.success("Đơn hàng này đã được thanh toán đủ!");
            return;
        }

        try {
            setPaymentLoading(true);
            const res = await paymentApi.createPaymentUrl({
                booking_id: selectedBookingId,
                bankCode: '' // Optional
            });

            console.log('Payment API Response:', res);

            // Check structure
            let redirectUrl = null;
            if (res.data && typeof res.data === 'string') {
                redirectUrl = res.data;
            } else if (res.data && res.data.paymentUrl) {
                redirectUrl = res.data.paymentUrl;
            } else if (res.paymentUrl) { // Handle case where res is the data object
                redirectUrl = res.paymentUrl;
            }

            if (redirectUrl && typeof redirectUrl === 'string') {
                console.log('Redirecting to:', redirectUrl);
                // Redirect to VNPay
                window.location.href = redirectUrl;
            } else {
                console.error('Invalid payment URL (not a string):', redirectUrl);
                message.error("Lỗi: Link thanh toán không hợp lệ (Dữ liệu trả về sai định dạng)");
            }
        } catch (error) {
            console.error(error);
            // Handle specific case where booking is fully paid
            if (error.response && error.response.status === 400 && error.response.data?.message?.includes("fully paid")) {
                message.success("Đơn hàng này đã được thanh toán đủ!");
            } else {
                message.error("Lỗi khi tạo thanh toán: " + (error.response?.data?.message || "Lỗi không xác định"));
            }
        } finally {
            setPaymentLoading(false);
        }
    };

    const historyColumns = [
        {
            title: "Dịch vụ",
            dataIndex: ["service", "name"],
            render: (name) => name || "N/A"
        },
        {
            title: "Phòng",
            dataIndex: ["booking", "bookingRooms"],
            render: (bookingRooms) => {
                if (!bookingRooms || !Array.isArray(bookingRooms) || bookingRooms.length === 0) return "N/A";
                return bookingRooms
                    .map((br) => `Phòng ${br?.room?.room_number || "N/A"}`)
                    .join(", ");
            },
            width: 120
        },
        {
            title: "Số lượng",
            dataIndex: "quantity",
            align: "center",
            width: 100
        },
        {
            title: "Đơn giá",
            dataIndex: ["service", "price"],
            render: (price) => price ? `${parseFloat(price).toLocaleString("vi-VN")} VNĐ` : "N/A",
            width: 150
        },
        {
            title: "Tổng tiền",
            dataIndex: "total_price",
            render: (price) => (
                <Tag color="purple">
                    {price ? parseFloat(price).toLocaleString("vi-VN") : 0} VNĐ
                </Tag>
            ),
            width: 150
        },
        {
            title: "Thời gian",
            dataIndex: "usage_time",
            render: (time) => time ? new Date(time).toLocaleString("vi-VN") : "",
            width: 180
        }
    ];

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="landing-page">
            <div className="header-container" style={{ position: 'relative' }}>
                <Navbar />
                <SubNavbar />
            </div>
            <div className="main-content" style={{ marginTop: 0, padding: "24px" }}>
                <h1 style={{ marginBottom: 24 }}>
                    <ShoppingCartOutlined /> Gọi dịch vụ
                </h1>

                {/* Active Booking Info - Show if user has checked-in bookings */}
                {activeBookings.length === 0 && (
                    <Card style={{ marginBottom: 24, textAlign: 'center', borderColor: '#faad14', backgroundColor: '#fffbe6' }}>
                        <Space direction="vertical" align="center">
                            <h3 style={{ color: '#856404' }}>
                                <CalendarOutlined /> Bạn chưa có phòng đang lưu trú
                            </h3>
                            <p>Vui lòng thực hiện <b>Check-in</b> tại quầy lễ tân để có thể sử dụng tính năng gọi dịch vụ tại phòng.</p>
                            <Button type="primary" onClick={() => window.location.href = '/booking-history'}>
                                Xem lịch sử đặt phòng
                            </Button>
                        </Space>
                    </Card>
                )}

                {activeBookings.length > 0 && (
                    <Card
                        title={
                            <Space>
                                <HomeOutlined />
                                <span>Chọn phòng để gọi dịch vụ</span>
                            </Space>
                        }
                        style={{ marginBottom: 24 }}
                    >
                        {/* Room Selector - Show if user has multiple bookings */}
                        {activeBookings.length > 1 && (
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                                    Chọn phòng lưu trú:
                                </label>
                                <Select
                                    style={{ width: '100%' }}
                                    value={selectedBookingId}
                                    onChange={setSelectedBookingId}
                                    placeholder="Chọn phòng..."
                                >
                                    {Array.isArray(activeBookings) && activeBookings.map((booking) => (
                                        <Select.Option key={booking.booking_id} value={booking.booking_id}>
                                            Booking #{booking.booking_id} -
                                            {booking.bookingRooms?.map((br) => ` Phòng ${br.room?.room_number}`).join(', ')}
                                            {' '}({booking.checkin_date} → {booking.checkout_date})
                                        </Select.Option>
                                    ))}
                                </Select>
                            </div>
                        )}

                        {/* Show selected booking details */}
                        {selectedBookingId && (() => {
                            const selectedBooking = activeBookings.find(b => b.booking_id === selectedBookingId);
                            return selectedBooking ? (
                                <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
                                    <Descriptions.Item label="Mã đặt phòng">
                                        <Tag color="blue">#{selectedBooking.booking_id}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Check-in">
                                        <CalendarOutlined /> {selectedBooking.checkin_date}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Check-out">
                                        <CalendarOutlined /> {selectedBooking.checkout_date}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái">
                                        <Tag color="green">Đang lưu trú</Tag>
                                    </Descriptions.Item>
                                    {selectedBooking.bookingRooms && selectedBooking.bookingRooms.length > 0 && (
                                        <Descriptions.Item label="Phòng">
                                            {selectedBooking.bookingRooms.map((br) => (
                                                <Tag key={br.room_id} color="cyan">
                                                    Phòng {br.room?.room_number}
                                                </Tag>
                                            ))}
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            ) : null;
                        })()}
                    </Card>
                )}

                {/* Services List - Always show */}
                <Card
                    title="Danh sách dịch vụ"
                    style={{ marginBottom: 24 }}
                >
                    {services.length === 0 ? (
                        <Empty description="Không có dịch vụ nào" />
                    ) : (
                        <Row gutter={[16, 16]}>
                            {Array.isArray(services) && services.map((service) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={service.service_id}>
                                    <Card
                                        hoverable
                                        style={{ height: "100%" }}
                                        bodyStyle={{ padding: 16 }}
                                    >
                                        <h3 style={{ marginBottom: 8, fontSize: 16 }}>
                                            {service.name}
                                        </h3>
                                        <p style={{ color: "#888", fontSize: 14, marginBottom: 12 }}>
                                            <DollarOutlined />{" "}
                                            {parseFloat(service.price).toLocaleString("vi-VN")} VNĐ
                                            {service.unit && ` / ${service.unit}`}
                                        </p>

                                        <Space.Compact style={{ width: "100%", marginBottom: 8 }}>
                                            <InputNumber
                                                min={1}
                                                value={quantities[service.service_id] || 1}
                                                onChange={(val) =>
                                                    setQuantities({ ...quantities, [service.service_id]: val })
                                                }
                                                style={{ width: "60%" }}
                                            />
                                            <Button
                                                type="primary"
                                                onClick={() => handleRequestService(service.service_id)}
                                                loading={requesting}
                                                style={{ width: "40%" }}
                                            >
                                                Gọi
                                            </Button>
                                        </Space.Compact>

                                        <div style={{ fontSize: 12, color: "#999", textAlign: "right" }}>
                                            Tổng: {((quantities[service.service_id] || 1) * parseFloat(service.price)).toLocaleString("vi-VN")} VNĐ
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Card>

                {/* Service History */}
                <Card
                    title={
                        <Space>
                            <HistoryOutlined />
                            <span>Lịch sử dịch vụ đã gọi</span>
                        </Space>
                    }
                    extra={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <Statistic
                                title="Tổng chi phí (Phòng + Dịch vụ)"
                                value={financials?.total || 0}
                                suffix="VNĐ"
                                valueStyle={{ fontSize: 16 }}
                            />
                            <Statistic
                                title="Đã thanh toán"
                                value={financials?.totalPaid || 0}
                                suffix="VNĐ"
                                valueStyle={{ fontSize: 16, color: '#3f8600' }}
                            />
                            <Statistic
                                title="Cần thanh toán thêm"
                                value={financials?.remainingAmount || 0}
                                suffix="VNĐ"
                                valueStyle={{ fontSize: 18, color: "#cf1322", fontWeight: 'bold' }}
                            />
                            <Button
                                type="primary"
                                danger
                                icon={<DollarOutlined />}
                                onClick={handlePayment}
                                loading={paymentLoading}
                                disabled={remainingAmount <= 0}
                            >
                                {remainingAmount > 0 ? "Thanh toán ngay" : "Đã thanh toán đủ"}
                            </Button>
                        </div>
                    }
                >
                    <Table
                        rowKey="usage_id"
                        columns={historyColumns}
                        dataSource={serviceHistory}
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: "Chưa có dịch vụ nào" }}
                    />
                </Card>
            </div>
        </div>
    );
};

export default UserServiceRequest;
