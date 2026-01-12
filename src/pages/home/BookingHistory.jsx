import { useState, useEffect } from "react";
import {
  Card,
  Typography,
  message,
  Spin,
  Button,
  Tag,
  Input,
  Form,
  Popconfirm,
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
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import Navbar from "../../components/home/Navbar";
import SubNavbar from "../../components/home/SubNavbar";
import Footer from "../../components/home/Footer";
import bookingApi from "../../api/bookingApi";
import paymentApi from "../../api/paymentApi";
import "./BookingHistory.css";
import socket from "../../utils/socket";

dayjs.locale("vi");
const { Title, Text } = Typography;

const getStatusConfig = (status, isPaid) => {
  const statusMap = {
    pending: { color: "orange", text: "Chờ xác nhận", icon: "⏳" },
    confirmed: { color: "cyan", text: "Chờ nhận phòng", icon: "🏨" },
    checked_in: { color: "green", text: "Đã nhận phòng", icon: "🛌" },
    checked_out: { color: "purple", text: "Đã trả phòng", icon: "👋" },
    paid: { color: "blue", text: "Đã thanh toán", icon: "💳" },
    cancelled: { color: "red", text: "Đã hủy", icon: "❌" },
    cancelling: { color: "volcano", text: "Đang chờ hủy", icon: "⚠️" },
    completed: { color: "blue", text: "Hoàn thành", icon: "✅" },
  };
  return statusMap[status] || { color: "default", text: status, icon: "❓" };
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return dayjs(dateString).format("dddd, DD/MM/YYYY");
};

// ---------------------------------------------------------
// COMPONENT: THẺ HIỂN THỊ TÓM TẮT ĐẶT PHÒNG
// ---------------------------------------------------------
const BookingCard = ({
  booking,
  isSelected,
  onClick,
  onCancel,
  cancelling,
}) => {
  // Tính toán các thông tin cơ bản để hiển thị lên thẻ
  if (!booking) return null;

  const brs = booking.bookingRooms || [];
  let minI = null;
  let maxO = null;

  // Tìm ngày nhận phòng sớm nhất và ngày trả phòng muộn nhất
  brs.forEach((br) => {
    const start = dayjs(br.checkin_date || booking.checkin_date);
    const end = dayjs(br.checkout_date || booking.checkout_date);
    if (!minI || start.isBefore(minI)) minI = start;
    if (!maxO || end.isAfter(maxO)) maxO = end;
  });

  // Tính số đêm lưu trú
  const stayNights = minI && maxO ? maxO.diff(minI, "day") : 1;
  const nights = Math.max(1, stayNights);

  // Tính tổng tiền (Tiền phòng + Tiền dịch vụ)
  const roomPrice = parseFloat(booking.total_price || 0);
  const servicePrice = booking.financials?.serviceTotal || 0;
  const grandTotal = roomPrice + servicePrice;

  const isPaid = booking.invoice?.payments?.some(
    (p) => p.status === "completed"
  );
  const statusConfig = getStatusConfig(booking.status, isPaid);
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
        <div
          style={{
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {isPaid && (
            <Tag color="blue" icon={<CreditCardOutlined />}>
              Đã thanh toán
            </Tag>
          )}
          <Tag color={statusConfig.color} className="status-tag">
            {statusConfig.icon} {statusConfig.text}
            {booking.status === "checked_in" &&
              booking.bookingRooms?.length > 1 &&
              ` (${
                booking.bookingRooms.filter((br) => br.status === "checked_in")
                  .length
              }/${booking.bookingRooms.length})`}
          </Tag>
        </div>
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
              {minI.format("DD/MM/YYYY")} - {maxO.format("DD/MM/YYYY")}
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

        {/* --- NÚT HỦY ĐẶT PHÒNG --- */}
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

// ---------------------------------------------------------
// COMPONENT: FORM CHI TIẾT VÀ THANH TOÁN
// ---------------------------------------------------------
const PaymentForm = ({ booking, user, onPayment, paying }) => {
  const [localPaymentMethod, setLocalPaymentMethod] = useState("online");

  // Reset phương thức thanh toán mỗi khi đổi booking
  useEffect(() => {
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

  // --- LOGIC TÍNH TOÁN CHI TIẾT ---
  const brs = booking.bookingRooms || [];
  let minI = null;
  let maxO = null;
  brs.forEach((br) => {
    const start = dayjs(br.checkin_date || booking.checkin_date);
    const end = dayjs(br.checkout_date || booking.checkout_date);
    if (!minI || start.isBefore(minI)) minI = start;
    if (!maxO || end.isAfter(maxO)) maxO = end;
  });

  const roomTotal = parseFloat(booking.total_price || 0);
  const serviceTotal = booking.financials?.serviceTotal || 0;
  const grandTotal = roomTotal + serviceTotal;

  // Tính tổng tiền khách đã thanh toán
  const totalPaid = (booking.invoice?.payments || [])
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const remainingAmount = Math.max(0, grandTotal - totalPaid);
  const nights = maxO ? maxO.diff(minI, "day") : 1;
  // ------------------------------------

  const isPaid = booking.invoice?.payments?.some(
    (p) => p.status === "completed"
  );
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
        {/* <div className="form-section">
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
                </div> */}

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
              <Text strong>Trạng thái đơn:</Text>
              <Tag color={statusConfig.color}>
                {statusConfig.icon} {statusConfig.text}
                {booking.status === "checked_in" &&
                  booking.bookingRooms?.length > 1 &&
                  ` (${
                    booking.bookingRooms.filter(
                      (br) => br.status === "checked_in"
                    ).length
                  }/${booking.bookingRooms.length})`}
              </Tag>
            </div>
            <div className="detail-row">
              <Text strong>Thanh toán:</Text>
              {isPaid ? (
                <Tag color="blue" icon={<CreditCardOutlined />}>
                  Đã thanh toán đầy đủ
                </Tag>
              ) : (
                <Tag color="default" icon={<ClockCircleOutlined />}>
                  Chưa thanh toán
                </Tag>
              )}
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
              <Text strong>Các phòng:</Text>
              <div style={{ width: "100%", marginTop: "4px" }}>
                {booking.bookingRooms?.map((br) => (
                  <div
                    key={br.room_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                      background: "#f5f5f5",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    <span>
                      {br.room?.roomType?.name} -{" "}
                      <Text strong>Phòng {br.room?.room_number}</Text>
                    </span>
                    <Tag
                      color={
                        br.status === "checked_in"
                          ? "green"
                          : br.status === "checked_out"
                          ? "blue"
                          : "default"
                      }
                      style={{ margin: 0 }}
                    >
                      {br.status === "checked_in"
                        ? "Đã nhận"
                        : br.status === "checked_out"
                        ? "Đã trả"
                        : "Chờ nhận"}
                    </Tag>
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

          <Form.Item label="Ngày nhận phòng (Sớm nhất)">
            <Input
              value={minI ? minI.format("dddd, DD/MM/YYYY") : ""}
              readOnly
              prefix={<CalendarOutlined />}
              className="date-input"
            />
          </Form.Item>

          <Form.Item label="Ngày trả phòng (Muộn nhất)">
            <Input
              value={maxO ? maxO.format("dddd, DD/MM/YYYY") : ""}
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
            <div className="price-table">
              <div className="price-table-row">
                <Text>Tiền phòng (đã giảm giá):</Text>
                <Text strong>{roomTotal.toLocaleString("vi-VN")} VNĐ</Text>
              </div>
              <div className="price-table-row">
                <Text>Tổng tiền dịch vụ:</Text>
                <Text strong>{serviceTotal.toLocaleString("vi-VN")} VNĐ</Text>
              </div>

              <div className="price-divider"></div>

              <div className="price-table-row total">
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

              <div className="price-table-row paid">
                <Text>Đã thanh toán:</Text>
                <Text strong style={{ color: "#52c41a" }}>
                  {totalPaid.toLocaleString("vi-VN")} VNĐ
                </Text>
              </div>

              {remainingAmount > 0 && (
                <div className="price-table-row credit">
                  <Text strong>Còn lại cần thanh toán:</Text>
                  <Text strong style={{ color: "#ff4d4f" }}>
                    {remainingAmount.toLocaleString("vi-VN")} VNĐ
                  </Text>
                </div>
              )}

              {booking.invoice?.status === "refund" && (
                <div className="price-table-row refunded">
                  <Text strong style={{ color: "#722ed1" }}>
                    Đã hoàn tiền:
                  </Text>
                  <Text strong style={{ color: "#722ed1" }}>
                    {roomTotal.toLocaleString("vi-VN")} VNĐ
                  </Text>
                </div>
              )}
            </div>
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
      // Gọi requestCancellation thay vì trực tiếp update sang cancelled nếu đã thanh toán
      await bookingApi.requestCancellation(bookingId);
      message.success("Đã gửi yêu cầu hủy booking thành công");
      fetchBookings();
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
