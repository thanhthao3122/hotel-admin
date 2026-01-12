import { useState, useEffect } from "react";
import {
  
  Typography,
  message,
  Spin,
  Button,
  Tag,
  Input,
  Form,
  Popconfirm,
  Card
} from "antd";
import {
  CreditCardOutlined,
  CalendarOutlined,
  HomeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import Navbar from "../../components/home/Navbar";
import SubNavbar from "../../components/home/SubNavbar";
import Footer from "../../components/home/Footer";
import bookingApi from "../../api/bookingApi";
import paymentApi from "../../api/paymentApi";
import "./BookingHistory.css";
import socket from "../../utils/socket";

const { Title, Text } = Typography;

// Hàm hỗ trợ tính toán tổng số
const calculateBookingDetails = (booking) => {
  if (!booking)
    return {
      nights: 0,
      roomTotal: 0,
      serviceTotal: 0,
      grandTotal: 0,
      discountAmount: 0,
    };

  const checkin = new Date(booking.checkin_date);
  const checkout = new Date(booking.checkout_date);
  const nights = Math.max(
    1,
    Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24))
  );

  // roomTotal is the final PRICE after discount
  const roomTotal = parseFloat(booking.total_price || 0);

  // Calculate original total before discount to show the discount amount
  const originalRoomTotal =
    booking.bookingRooms?.reduce((sum, br) => {
      const brCheckin = new Date(br.checkin_date || booking.checkin_date);
      const brCheckout = new Date(br.checkout_date || booking.checkout_date);
      const brNights = Math.max(
        1,
        Math.ceil((brCheckout - brCheckin) / (1000 * 60 * 60 * 24))
      );
      const basePrice = parseFloat(
        br.room?.roomType?.base_price || br.price_per_night || 0
      );
      return sum + basePrice * brNights;
    }, 0) || 0;

  const discountAmount =
    originalRoomTotal > roomTotal ? originalRoomTotal - roomTotal : 0;

  // Tính tổng tiền dịch vụ - Ưu tiên từ financials (backend) nếu có
  let serviceTotal = 0;
  if (booking.financials && booking.financials.serviceTotal !== undefined) {
    serviceTotal = parseFloat(booking.financials.serviceTotal);
  } else {
    // Dự phòng: Tổng hợp từ bookingRooms
    serviceTotal =
      booking.bookingRooms?.reduce((sum, br) => {
        const usages = br.serviceUsages || [];
        return (
          sum +
          usages.reduce((suSum, u) => suSum + parseFloat(u.total_price || 0), 0)
        );
      }, 0) || 0;
  }

  const totalRefunded =
    booking.refunds?.reduce(
      (sum, r) => sum + parseFloat(r.amount_refunded || 0),
      0
    ) || 0;
  const grandTotal = roomTotal + serviceTotal;

  const totalPaid =
    booking.payments
      ?.filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;

  const actualCollected = totalPaid - totalRefunded;

  return {
    nights,
    roomTotal,
    originalRoomTotal,
    discountAmount,
    serviceTotal,
    grandTotal,
    totalPaid,
    totalRefunded,
    actualCollected,
  };
};

const getStatusConfig = (status) => {
  const statusMap = {
        'pending': { color: 'orange', text: 'Chờ xác nhận', icon: '⏳' },
        'confirmed': { color: 'cyan', text: 'Đã xác nhận', icon: '🏨' },
        'completed': { color: 'purple', text: 'Đã trả phòng', icon: '👋' },
        'paid': { color: 'blue', text: 'Đã thanh toán', icon: '💳' },
        'cancelled': { color: 'red', text: 'Đã hủy', icon: '❌' }
  };
  return statusMap[status] || { color: "default", text: status, icon: "❓" };
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
};

// Component con: Thẻ đặt phòng
const BookingCard = ({
  booking,
  isSelected,
  onClick,
  onCancel,
  cancelling,
}) => {
  const { nights, grandTotal } = calculateBookingDetails(booking);
  const isPaid = booking.payments?.some((p) => p.status === "completed");
  const statusConfig = getStatusConfig(booking.status, isPaid);
  // Chỉ cho phép hủy khi đang chờ xác nhận hoặc đã xác nhận (chưa nhận phòng) VÀ chưa thanh toán
  const canCancel =
    ["pending", "confirmed"].includes(booking.status) && !isPaid;

  return (
    <Card
      className={`booking-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      hoverable
    >
      <div className="booking-card-header">
        <Text strong className="booking-id">
          #{booking.booking_id}
        </Text>
        <Tag color={statusConfig.color} className="status-tag">
          {statusConfig.icon} {statusConfig.text}
        </Tag>
      </div>

      <div className="booking-card-body">
        <div className="booking-info-row">
          <HomeOutlined className="info-icon" />
          <div className="info-content">
            {booking.bookingRooms && booking.bookingRooms.length > 0 ? (
              booking.bookingRooms.map((br) => (
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
            <Text>
              {new Date(booking.checkin_date).toLocaleDateString("vi-VN")} -{" "}
              {new Date(booking.checkout_date).toLocaleDateString("vi-VN")}
            </Text>
            <Text type="secondary"> ({nights} đêm)</Text>
          </div>
        </div>

        <div className="booking-total">
          <Text type="secondary">Tổng tiền:</Text>
          <Text strong className="total-price">
            {grandTotal.toLocaleString("vi-VN")} VNĐ
          </Text>
        </div>

        <div className="booking-payment-method" style={{ marginTop: "8px" }}>
          <Text type="secondary">Hình thức: </Text>
          <Tag
            color={booking.payment_method === "pay_later" ? "cyan" : "green"}
          >
            {booking.payment_method === "pay_later"
              ? "Thanh toán sau"
              : "Thanh toán online"}
          </Tag>
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
              style={{ marginTop: "12px" }}
            >
              Hủy booking
            </Button>
          </Popconfirm>
        )}
      </div>
    </Card>
  );
};

// Component con: Form thanh toán
const PaymentForm = ({ booking, user, onPayment, paying }) => {
  const [localPaymentMethod, setLocalPaymentMethod] = useState("online");

  useEffect(() => {
    // Luôn mặc định là thanh toán trực tuyến trong trang lịch sử cho các lần thanh toán đang hoạt động
    setLocalPaymentMethod("online");
  }, [booking]);

  if (!booking) {
    return (
      <Card className="payment-form-card empty">
        <div className="empty-state">
          <CreditCardOutlined className="empty-icon" />
          <Title level={4}>Chọn booking để thanh toán</Title>
          <Text type="secondary">
            Vui lòng chọn một booking từ danh sách bên trái
          </Text>
        </div>
      </Card>
    );
  }

  const {
    nights,
    roomTotal,
    originalRoomTotal,
    discountAmount,
    serviceTotal,
    grandTotal,
    totalPaid,
    totalRefunded,
  } = calculateBookingDetails(booking);
  const isPaid = booking.payments?.some((p) => p.status === "completed");
  const statusConfig = getStatusConfig(booking.status, isPaid);
  // Cho phép thanh toán nếu đơn đặt phòng đang chờ hoặc đã xác nhận VÀ chưa thanh toán
  const canPay =
    (booking.status === "pending" || booking.status === "confirmed") && !isPaid;

  // Kiểm tra xem có khoản thanh toán nào đang chờ xử lý không - NHƯNG người dùng muốn bỏ qua trạng thái "Đang xử lý"
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
            <Input value={user.email} readOnly prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item label="Số điện thoại">
            <Input
              value={user.phone || "Chưa cập nhật"}
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
              <Text strong>Hình thức:</Text>
              <Tag
                color={
                  booking.payment_method === "pay_later" ? "cyan" : "green"
                }
              >
                {booking.payment_method === "pay_later"
                  ? "Thanh toán sau"
                  : "Thanh toán online"}
              </Tag>
            </div>
            <div className="detail-row">
              <Text strong>Phòng:</Text>
              <div>
                {booking.bookingRooms?.map((br) => (
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
            {/* Room Breakdown */}
            {booking.bookingRooms?.map((br, index) => {
              const brCheckin = new Date(
                br.checkin_date || booking.checkin_date
              );
              const brCheckout = new Date(
                br.checkout_date || booking.checkout_date
              );
              const brNights = Math.max(
                1,
                Math.ceil((brCheckout - brCheckin) / (1000 * 60 * 60 * 24))
              );
              return (
                <div
                  key={index}
                  className="price-row room-detail"
                  style={{
                    borderLeft: "3px solid #003580",
                    paddingLeft: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Text strong>
                      🏨 {br.room?.roomType?.name} - Phòng{" "}
                      {br.room?.room_number}
                    </Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {formatDate(br.checkin_date || booking.checkin_date)} -{" "}
                      {formatDate(br.checkout_date || booking.checkout_date)} (
                      {brNights} đêm)
                    </Text>
                  </div>
                  <Text>
                    {(
                      parseFloat(
                        br.room?.roomType?.base_price || br.price_per_night || 0
                      ) * brNights
                    ).toLocaleString("vi-VN")}{" "}
                    VNĐ
                  </Text>
                </div>
              );
            })}

            {/* Voucher Discount */}
            {discountAmount > 0 && (
              <div
                className="price-row voucher-row"
                style={{
                  color: "#52c41a",
                  backgroundColor: "#f6ffed",
                  padding: "8px",
                  borderRadius: "4px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span>🎟️</span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Text strong style={{ color: "#52c41a" }}>
                      Mã giảm giá: {booking.voucher?.code || "VOUCHER"}
                    </Text>
                    {booking.voucher?.discount_type === "percentage" && (
                      <Text
                        type="secondary"
                        style={{ fontSize: "12px", color: "#52c41a" }}
                      >
                        Giảm {booking.voucher.discount_value}%
                      </Text>
                    )}
                  </div>
                </div>
                <Text strong style={{ color: "#52c41a" }}>
                  -{discountAmount.toLocaleString("vi-VN")} VNĐ
                </Text>
              </div>
            )}

            <div className="price-row" style={{ marginTop: "12px" }}>
              <Text>🍽️ Dịch vụ sử dụng:</Text>
              <Text strong>{serviceTotal.toLocaleString("vi-VN")} VNĐ</Text>
            </div>
            {/* Liệt kê các dịch vụ cụ thể nếu cần */}
            {booking.services && booking.services.length > 0 && (
              <div
                className="services-list"
                style={{
                  paddingLeft: "20px",
                  fontSize: "0.9em",
                  color: "#666",
                }}
              >
                {booking.services.map((service, idx) => (
                  <div
                    key={idx}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>
                      - {service.name} (x{service.ServiceUsage?.quantity})
                    </span>
                    <span>
                      {parseFloat(
                        service.ServiceUsage?.total_price
                      ).toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Fallback for serviceUsages from controller include */}
            {!booking.services &&
              booking.serviceUsages &&
              booking.serviceUsages.length > 0 && (
                <div
                  className="services-list"
                  style={{
                    paddingLeft: "20px",
                    fontSize: "0.9em",
                    color: "#666",
                  }}
                >
                  {booking.serviceUsages.map((usage, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        - {usage.service?.name} (x{usage.quantity})
                      </span>
                      <span>
                        {parseFloat(usage.total_price).toLocaleString("vi-VN")}{" "}
                        VNĐ
                      </span>
                    </div>
                  ))}
                </div>
              )}

            <div className="price-divider"></div>
            <div className="price-row total">
              <Title level={4} style={{ margin: 0 }}>
                Tổng cộng:
              </Title>
              <Text
                strong
                className="total-amount"
                style={{ fontSize: "24px", color: "#ff4d4f" }}
              >
                {grandTotal.toLocaleString("vi-VN")} VNĐ
              </Text>
            </div>
            {totalRefunded > 0 && (
              <>
                <div className="price-row" style={{ color: "#ff4d4f" }}>
                  <Text type="danger">Số tiền đã hoàn trả:</Text>
                  <Text strong>
                    -{totalRefunded.toLocaleString("vi-VN")} VNĐ
                  </Text>
                </div>
                <div
                  className="price-row"
                  style={{
                    borderTop: "1px dashed #d9d9d9",
                    paddingTop: "8px",
                    marginTop: "4px",
                  }}
                >
                  <Text strong>Thực thu cuối cùng:</Text>
                  <Text strong style={{ color: "#52c41a" }}>
                    {(totalPaid - totalRefunded).toLocaleString("vi-VN")} VNĐ
                  </Text>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Phương thức thanh toán - Ẩn vì bây giờ luôn là trực tuyến */}
        {canPay && (
          <div className="form-section" style={{ display: "none" }}>
            <Title level={5} className="section-title">
              💳 Phương thức thanh toán
            </Title>
          </div>
        )}

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
              style={{
                backgroundColor: "#faad14",
                borderColor: "#faad14",
                color: "white",
                opacity: 0.8,
              }}
            >
              Đang xử lý thông tin...
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              block
              icon={<CreditCardOutlined />}
              onClick={() => onPayment(booking.booking_id, localPaymentMethod)}
              loading={paying}
              className="payment-button"
            >
              {paying ? "Đang xử lý..." : "Tiến hành thanh toán"}
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
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              color: "white",
              opacity: 1,
            }}
          >
            {isPaid ? "Thanh toán thành công" : "Không thể thanh toán"}
          </Button>
        )}

        {/* Đã xóa ghi chú thanh toán sau */}
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
  const user = JSON.parse(localStorage.getItem("user"));

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
      console.error("Error fetching bookings:", error);
      message.error("Không thể tải lịch sử đặt phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    socket.on("booking_updated", (data) => {
      if (data.user_id === user?.user_id || !data.user_id) {
        fetchBookings();
        message.info("Thông tin đặt phòng vừa được cập nhật");
      }
    });

    socket.on("payment_received", () => {
      fetchBookings();
      message.success("Thanh toán thành công!");
    });

    return () => {
      socket.off("booking_updated");
      socket.off("payment_received");
    };
  }, []);

  const handlePayment = async (bookingId, chosenMethod) => {
    try {
      setPaying(true);

      // Nếu khách chọn đổi phương thức thanh toán khác với lúc đầu
      if (chosenMethod !== selectedBooking.payment_method) {
        await bookingApi.update(bookingId, { payment_method: chosenMethod });
        // Socket hoặc fetch lại sẽ cập nhật list sau
      }

      if (chosenMethod === "online") {
        const response = await paymentApi.createPaymentUrl({
          booking_id: bookingId,
        });
        window.location.href = response.data.paymentUrl;
      } else {
        message.success(
          "Đã xác nhận thanh toán sau. Hẹn gặp bạn tại khách sạn!"
        );
        fetchBookings();
      }
    } catch (error) {
      console.error("Error handling payment choice:", error);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi xử lý thanh toán"
      );
    } finally {
      setPaying(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setCancelling(bookingId);
      await bookingApi.updateStatus(bookingId, "cancelled");
      message.success("Đã hủy booking thành công");

      // Làm mới danh sách đặt phòng
      const response = await bookingApi.getByUser(user.user_id);
      const validBookings =
        response.data.filter((b) => b.status !== "cancelled") || [];
      setBookings(validBookings);

      // Nếu đơn đặt phòng đã hủy đang được chọn, hãy xóa lựa chọn
      if (selectedBooking?.booking_id === bookingId) {
        setSelectedBooking(validBookings.length > 0 ? validBookings[0] : null);
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      message.error(error.response?.data?.message || "Không thể hủy booking");
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
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking.booking_id}
                    booking={booking}
                    isSelected={
                      selectedBooking?.booking_id === booking.booking_id
                    }
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
