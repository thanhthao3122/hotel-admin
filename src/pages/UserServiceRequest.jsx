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
    Select,
    Steps,
    Divider,
    Typography,
    Badge
} from "antd";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
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
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [serviceHistory, setServiceHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const [quantities, setQuantities] = useState({});
    const [currentStep, setCurrentStep] = useState(0); // Quản lý bước hiện tại cho báo cáo đồ án

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

    // TỰ ĐỘNG CHỌN PHÒNG: Nếu khách chỉ có 1 phòng duy nhất, hệ thống sẽ tự chọn luôn
    useEffect(() => {
        if (selectedBookingId && activeBookings.length > 0) {
            const booking = activeBookings.find(b => b.booking_id === selectedBookingId);
            if (booking && booking.bookingRooms?.length === 1) {
                setSelectedRoomId(booking.bookingRooms[0].id);
                // Nếu tự động chọn xong thì có thể nhảy sang bước 2 luôn cho mượt
                if (currentStep === 0) setCurrentStep(1);
            }
        }
    }, [selectedBookingId, activeBookings]);

    // Giải thích cho Đồ án: Chức năng chuyển bước
    const nextStep = () => setCurrentStep(currentStep + 1);
    const prevStep = () => setCurrentStep(currentStep - 1);

    /**
     * Hàm xử lý khi khách nhấn nút "Gọi" dịch vụ
     */
    const handleRequestService = async (serviceId) => {
        const quantity = quantities[serviceId] || 1;
console.log("quantity", quantity);


        if (quantity < 1) {
            message.warning("Số lượng phải lớn hơn 0");
            return;
        }

        // Kiểm tra xem đã chọn phòng chưa (Rất quan trọng vì ServiceUsage lưu theo phòng)
        if (!selectedBookingId) {
            message.warning({
                content: "Vui lòng đặt phòng và nhận phòng (Check-in) để có thể gọi dịch vụ",
                duration: 5
            });
            return;
        }

        if (!selectedRoomId) {
            message.warning("Vui lòng chọn số phòng mà bạn muốn chúng tôi phục vụ dịch vụ này!");
            return;
        }

        try {
            setRequesting(true);
            // Gửi yêu cầu lên server qua API
            await serviceUsageApi.requestService({
                booking_id: selectedBookingId,
                service_id: serviceId,
                quantity,
                booking_room_id: selectedRoomId // Truyền ID của BookingRoom
            });

            message.success("Yêu cầu của bạn đã được gửi tới quầy lễ tân!");

            // Reset số lượng về 1 sau khi gọi xong
            setQuantities({ ...quantities, [serviceId]: 1 });

            // Tải lại dữ liệu (Lịch sử + Hóa đơn) để cập nhật số liệu mới nhất
            await fetchData();
        } catch (error) {
            console.error('Lỗi handleRequestService:', error);
            const errorMsg = error.response?.data?.message || "Không thể gọi dịch vụ lúc này, vui lòng thử lại sau";
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
            key: "room",
            render: (_, record) => {
                // If specific room is recorded
                if (record.bookingRoom?.room?.room_number) {
                    return `Phòng ${record.bookingRoom.room.room_number}`;
                }

                // Fallback (for old data or if no room selected)
                const bookingRooms = record.booking?.bookingRooms;
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
        <div className="landing-page" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div className="header-container">
                <Navbar />
                <SubNavbar />
            </div>

            <div className="main-content" style={{ maxWidth: 1200, margin: '0 auto', padding: "40px 24px" }}>
                <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ textAlign: "center", marginBottom: 40 }}>
                        <Title level={2}>
                            <ShoppingCartOutlined style={{ color: '#1890ff', marginRight: 12 }} />
                            Hệ Thống Gọi Dịch Vụ Tại Phòng
                        </Title>
                        <Paragraph type="secondary">
                            Tiện ích dành cho khách hàng đang lưu trú tại khách sạn
                        </Paragraph>
                    </div>

                    {/* 
                      * GIẢI THÍCH ĐỒ ÁN: Sử dụng Component Steps để minh họa quy trình nghiệp vụ rõ ràng.
                      * Bước 1: Xác thực Check-in.
                      * Bước 2: Lựa chọn dịch vụ theo danh mục.
                      * Bước 3: Xem lại lịch sử và thực hiện thanh toán VNPay.
                      */}
                    <Steps
                        current={currentStep}
                        onChange={setCurrentStep}
                        style={{ marginBottom: 48, padding: '0 20px' }}
                        items={[
                            { title: 'Chọn Phòng', icon: <HomeOutlined /> },
                            { title: 'Gọi Dịch Vụ', icon: <ShoppingCartOutlined /> },
                            { title: 'Hóa Đơn & Thanh Toán', icon: <HistoryOutlined /> }
                        ]}
                    />

                    <Divider />

                    {/* BƯỚC 1: CHỌN PHÒNG VÀ XÁC THỰC LƯU TRÚ */}
                    {currentStep === 0 && (
                        <div className="step-content animate__animated animate__fadeIn">
                            {activeBookings.length === 0 ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <Space direction="vertical" align="center">
                                            <Text strong style={{ fontSize: 18 }}>Bạn chưa có phòng đang lưu trú</Text>
                                            <Text type="secondary">Vui lòng thực hiện Check-in tại quầy để mở khóa tính năng này.</Text>
                                            <Button type="primary" size="large" onClick={() => window.location.href = '/booking-history'}>
                                                Đến trang Lịch sử đặt phòng
                                            </Button>
                                        </Space>
                                    }
                                />
                            ) : (
                                <Row gutter={[24, 24]} justify="center">
                                    <Col span={24} style={{ textAlign: 'center' }}>
                                        <Title level={4}>Xác nhận phòng bạn đang ở</Title>
                                    </Col>
                                    {activeBookings.map(booking => (
                                        <Col key={booking.booking_id} xs={24} md={18} lg={12}>
                                            <Card
                                                hoverable
                                                className={`booking-selection-card ${selectedBookingId === booking.booking_id ? 'active' : ''}`}
                                                style={{ border: selectedBookingId === booking.booking_id ? '2px solid #1890ff' : '1px solid #f0f0f0' }}
                                                onClick={() => setSelectedBookingId(booking.booking_id)}
                                            >
                                                <Row align="middle" gutter={16}>
                                                    <Col span={4}>
                                                        <div style={{ background: '#e6f7ff', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                                                            <HomeOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                                                        </div>
                                                    </Col>
                                                    <Col span={20}>
                                                        <Title level={5} style={{ margin: 0 }}>Đơn đặt #{booking.booking_id}</Title>
                                                        <Text type="secondary">{booking.checkin_date} → {booking.checkout_date}</Text>
                                                    </Col>
                                                </Row>
                                                <Divider style={{ margin: '12px 0' }} />
                                                <Space wrap>
                                                    {booking.bookingRooms?.map(br => (
                                                        <Badge key={br.id} dot={selectedRoomId === br.id} offset={[-2, 2]} color="#1890ff">
                                                            <Button
                                                                type={selectedRoomId === br.id ? "primary" : "default"}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedRoomId(br.id);
                                                                    setSelectedBookingId(booking.booking_id);
                                                                }}
                                                            >
                                                                Phòng {br.room?.room_number}
                                                            </Button>
                                                        </Badge>
                                                    ))}
                                                </Space>
                                            </Card>
                                        </Col>
                                    ))}
                                    <Col span={24} style={{ textAlign: 'center', marginTop: 24 }}>
                                        <Button
                                            type="primary"
                                            size="large"
                                            disabled={!selectedRoomId}
                                            onClick={nextStep}
                                        >
                                            Tiếp tục Chọn dịch vụ
                                        </Button>
                                    </Col>
                                </Row>
                            )}
                        </div>
                    )}

                    {/* BƯỚC 2: CHỌN DỊCH VỤ DỰA TRÊN PHÒNG ĐÃ CHỌN */}
                    {currentStep === 1 && (
                        <div className="step-content animate__animated animate__fadeIn">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <Button icon={<HomeOutlined />} onClick={prevStep}>Quay lại chọn phòng</Button>
                                <Tag color="blue" style={{ padding: '4px 12px' }}>
                                    <HomeOutlined /> Đang chọn cho: Phòng {
                                        activeBookings.flatMap(b => b.bookingRooms).find(br => br?.id === selectedRoomId)?.room?.room_number
                                    }
                                </Tag>
                            </div>

                            <Row gutter={[20, 20]}>
                                {services.map((service) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={service.service_id}>
                                        <Card
                                            hoverable
                                            className="service-card"
                                            bodyStyle={{ padding: 20 }}
                                            style={{ borderRadius: 12 }}
                                        >
                                            <Title level={5} style={{ marginBottom: 4 }}>{service.name}</Title>
                                            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                                {parseFloat(service.price).toLocaleString("vi-VN")} VNĐ {service.unit && `/ ${service.unit}`}
                                            </Text>

                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <InputNumber
                                                    min={1}
                                                    value={quantities[service.service_id] || 1}
                                                    onChange={val => setQuantities({ ...quantities, [service.service_id]: val })}
                                                    style={{ flex: 1 }}
                                                />
                                                <Button
                                                    type="primary"
                                                    icon={<ShoppingCartOutlined />}
                                                    loading={requesting}
                                                    onClick={() => handleRequestService(service.service_id)}
                                                >
                                                    Gọi
                                                </Button>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <div style={{ textAlign: 'center', marginTop: 40 }}>
                                <Button type="default" size="large" onClick={nextStep}>
                                    Xem lịch sử & Thanh toán <HistoryOutlined />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* BƯỚC 3: XEM LẠI LỊCH SỬ VÀ CHI PHÍ TỔNG */}
                    {currentStep === 2 && (
                        <div className="step-content animate__animated animate__fadeIn">
                            <div style={{ marginBottom: 24 }}>
                                <Button onClick={prevStep}>Quay lại gọi thêm</Button>
                            </div>

                            <Title level={4} style={{ marginBottom: 16 }}>Lịch sử sử dụng dịch vụ trong kỳ lưu trú</Title>
                            <Table
                                columns={historyColumns}
                                dataSource={serviceHistory}
                                rowKey="usage_id"
                                pagination={{ pageSize: 5 }}
                                style={{ marginBottom: 32 }}
                                bordered
                            />

                            {/* TỔNG KẾT TÀI CHÍNH - GIẢI THÍCH ĐỒ ÁN: Tích hợp VNPay */}
                            {financials && (
                                <Card style={{ background: '#fafafa', borderRadius: 12 }}>
                                    <Row align="middle">
                                        <Col xs={24} md={14}>
                                            <Space direction="vertical">
                                                <Text type="secondary">Tóm tắt chi phí đơn #${selectedBookingId}:</Text>
                                                <Space split={<Divider type="vertical" />}>
                                                    <Statistic title="Tiền phòng" value={financials.roomTotal} suffix="VNĐ" />
                                                    <Statistic title="Dịch vụ" value={financials.serviceTotal} suffix="VNĐ" />
                                                </Space>
                                            </Space>
                                        </Col>
                                        <Col xs={24} md={10} style={{ textAlign: 'right' }}>
                                            <Statistic
                                                title={<Text strong style={{ fontSize: 16 }}>Cần thanh toán thêm</Text>}
                                                value={financials.remainingAmount}
                                                suffix="VNĐ"
                                                valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }}
                                            />
                                            {financials.remainingAmount > 0 ? (
                                                <Button
                                                    type="primary"
                                                    size="large"
                                                    icon={<DollarOutlined />}
                                                    loading={paymentLoading}
                                                    onClick={handlePayment}
                                                    style={{ height: 50, padding: '0 40px', marginTop: 16, borderRadius: 8 }}
                                                >
                                                    Thanh toán VNPay Ngay
                                                </Button>
                                            ) : (
                                                <Tag color="green" style={{ marginTop: 16, padding: '8px 16px', fontSize: 14 }}>
                                                    ĐÃ THANH TOÁN ĐỦ
                                                </Tag>
                                            )}
                                        </Col>
                                    </Row>
                                </Card>
                            )}
                        </div>
                    )}
                </Card>

                {/* KHỐI GIẢI THÍCH KỸ THUẬT DÀNH CHO BÁO CÁO ĐỒ ÁN */}
                <Card style={{ marginTop: 40, border: '1px solid #d9d9d9', backgroundColor: '#fafafa' }} title="💡 Giải thích logic cho báo cáo đồ án">
                    <Paragraph>
                        <ul style={{ paddingLeft: 20 }}>
                            <li><b>Lấy dữ liệu (Step 1):</b> Hệ thống sử dụng <code>serviceUsageApi.getMyBooking()</code> để lấy thông tin các phòng mà User đang Check-in. Chỉ những phòng có trạng thái <code>checked_in</code> mới được hiển thị.</li>
                            <li><b>Gọi API (Step 2):</b> Khi nhấn gọi, hàm <code>requestServiceByUser</code> ở backend sẽ nhận dữ liệu bao gồm <code>booking_room_id</code>. Điều này giúp hệ thống biết chính xác dịch vụ thuộc về phòng nào trong đơn đặt đa phòng.</li>
                            <li><b>Tính tiền:</b> Mọi chi phí dịch vụ được cộng dồn vào hóa đơn tổng thông qua hàm <code>calculateBookingTotal</code> ở backend, đảm bảo tính nhất quán của dữ liệu tài chính.</li>
                            <li><b>Socket.io:</b> Cập nhật real-time ngay lập tức giữa giao diện khách và lễ tân khi có một yêu cầu mới được gửi đi.</li>
                        </ul>
                    </Paragraph>
                </Card>
            </div>

            <style jsx>{`
                .booking-selection-card {
                    transition: all 0.3s;
                    border-radius: 12px;
                }
                .booking-selection-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
                }
                .active {
                    background-color: #e6f7ff;
                }
                .service-card {
                    transition: all 0.3s;
                }
                .service-card:hover {
                    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                    border-color: #40a9ff;
                }
                .step-content {
                    min-height: 400px;
                    padding-top: 20px;
                }
            `}</style>
        </div>
    );
};

export default UserServiceRequest;
