// src/pages/UserServiceRequest.jsx
import { useEffect, useMemo, useState } from "react";
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
  Typography,
  Steps,
} from "antd";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
import {
  ShoppingCartOutlined,
  HistoryOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined,
} from "@ant-design/icons";

import Navbar from "../components/home/Navbar";
import SubNavbar from "../components/home/SubNavbar";

import serviceUsageApi from "../api/serviceUsageApi";
import serviceApi from "../api/serviceApi";
import paymentApi from "../api/paymentApi";
import socket from "../utils/socket";

const { Option } = Select;

const UserServiceRequest = () => {
  const [services, setServices] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [quantities, setQuantities] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, bookingRes, historyRes] = await Promise.all([
        serviceApi.getAll(1, 200),
        serviceUsageApi.getMyBooking(), // ⚠️ backend phải trả bookingRooms có status checked_in
        serviceUsageApi.getMyHistory(),
      ]);

      const servicesData = servicesRes?.data || [];
      const bookingsData = bookingRes?.data || [];
      const historyData = historyRes?.data || [];

      setServices(Array.isArray(servicesData) ? servicesData : []);
      setActiveBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setServiceHistory(Array.isArray(historyData) ? historyData : []);

      // auto chọn booking đầu tiên
      if (
        !selectedBookingId &&
        Array.isArray(bookingsData) &&
        bookingsData.length > 0
      ) {
        setSelectedBookingId(bookingsData[0].booking_id);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      message.error(err?.response?.data?.message || "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ✅ Socket realtime refresh
  // =========================
  useEffect(() => {
    fetchData();

    const onInvoiceUpdated = (data) => {
      if (
        !selectedBookingId ||
        normalizeId(data.booking_id) === normalizeId(selectedBookingId)
      ) {
        fetchData();
      }
    };
    const onServiceAdded = (data) => {
      if (
        !selectedBookingId ||
        normalizeId(data.booking_id) === normalizeId(selectedBookingId)
      ) {
        fetchData();
      }
    };
    const onPaymentReceived = (data) => {
      if (
        !selectedBookingId ||
        normalizeId(data.booking_id) === normalizeId(selectedBookingId)
      ) {
        fetchData();
      }
    };

    socket.on("invoice_updated", onInvoiceUpdated);
    socket.on("service_added", onServiceAdded);
    socket.on("payment_received", onPaymentReceived);

    return () => {
      socket.off("invoice_updated", onInvoiceUpdated);
      socket.off("service_added", onServiceAdded);
      socket.off("payment_received", onPaymentReceived);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBookingId]);

  // Auto-select room when booking changes
  useEffect(() => {
    if (selectedBookingId && activeBookings.length > 0) {
      const booking = activeBookings.find(
        (b) => b.booking_id === selectedBookingId
      );
      if (booking && booking.bookingRooms?.length === 1) {
        // Use BookingRoom ID (the primary key 'id' of booking_rooms table)
        setSelectedRoomId(booking.bookingRooms[0].id);
      } else {
        setSelectedRoomId(null);
      }
    }
  }, [selectedBookingId, activeBookings]);

  const handleRequestService = async (serviceId) => {
    const quantity = quantities[serviceId] || 1;

    if (!selectedBookingId) {
      message.warning(
        "Bạn chưa có đơn đang lưu trú. Vui lòng check-in để gọi dịch vụ."
      );
      return;
    }

    if (!selectedRoomId) {
      message.warning(
        "Vui lòng chọn phòng đang lưu trú trước khi gọi dịch vụ!"
      );
      return;
    }

    // Check if user has selected a booking
    if (!selectedBookingId) {
      message.warning({
        content: "Vui lòng đặt phòng và check in để gọi dịch vụ",
        duration: 5,
      });
      return;
    }

    try {
      setRequesting(true);
      // Send booking_room_id to backend
      await serviceUsageApi.requestService({
        booking_id: selectedBookingId,
        service_id: serviceId,
        quantity,
        booking_room_id: selectedRoomId,
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
    const booking = activeBookings.find(
      (b) => b.booking_id === selectedBookingId
    );
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
        bankCode: "",
      });

      let redirectUrl = null;
      if (res?.data && typeof res.data === "string") redirectUrl = res.data;
      else if (res?.data?.paymentUrl) redirectUrl = res.data.paymentUrl;
      else if (res?.paymentUrl) redirectUrl = res.paymentUrl;

      if (redirectUrl && typeof redirectUrl === "string") {
        window.location.href = redirectUrl;
      } else {
        message.error("Link thanh toán không hợp lệ (sai định dạng)");
      }
    } catch (err) {
      console.error(err);
      message.error(
        "Lỗi khi tạo thanh toán: " +
          (err?.response?.data?.message || "Lỗi không xác định")
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const historyColumns = [
    {
      title: "Dịch vụ",
      dataIndex: ["service", "name"],
      render: (name) => name || "N/A",
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
        if (
          !bookingRooms ||
          !Array.isArray(bookingRooms) ||
          bookingRooms.length === 0
        )
          return "N/A";
        return bookingRooms
          .map((br) => `Phòng ${br?.room?.room_number || "N/A"}`)
          .join(", ");
      },
      width: 120,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      align: "center",
      width: 100,
    },
    {
      title: "Đơn giá",
      dataIndex: ["service", "price"],
      render: (price) =>
        price ? `${parseFloat(price).toLocaleString("vi-VN")} VNĐ` : "N/A",
      width: 150,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      render: (price) => (
        <Tag color="purple">
          {price ? parseFloat(price).toLocaleString("vi-VN") : 0} VNĐ
        </Tag>
      ),
      width: 150,
    },
    {
      title: "Thời gian",
      dataIndex: "usage_time",
      render: (time) => (time ? new Date(time).toLocaleString("vi-VN") : ""),
      width: 180,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  const hasActive = Array.isArray(activeBookings) && activeBookings.length > 0;
  /* Removed unused checkedInRooms */

  return (
    <div className="landing-page">
      <div className="header-container" style={{ position: "relative" }}>
        <Navbar />
        <SubNavbar />
      </div>
      <div className="main-content" style={{ marginTop: 0, padding: "24px" }}>
        <h1 style={{ marginBottom: 24 }}>
          <ShoppingCartOutlined /> Gọi dịch vụ
        </h1>

        {/* Active Booking Info - Show if user has checked-in bookings */}
        {activeBookings.length === 0 && (
          <Card
            style={{
              marginBottom: 24,
              textAlign: "center",
              borderColor: "#faad14",
              backgroundColor: "#fffbe6",
            }}
          >
            <Space direction="vertical" align="center">
              <h3 style={{ color: "#856404" }}>
                <CalendarOutlined /> Bạn chưa có phòng đang lưu trú
              </h3>
              <p>
                Vui lòng thực hiện <b>Check-in</b> tại quầy lễ tân để có thể sử
                dụng tính năng gọi dịch vụ tại phòng.
              </p>
              <Button
                type="primary"
                onClick={() => (window.location.href = "/booking-history")}
              >
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
            {/* Booking Selector (if multiple active bookings) */}
            {activeBookings.length > 1 && (
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: "bold",
                    color: "#555",
                  }}
                >
                  Bạn có nhiều đơn đặt phòng đang hoạt động, vui lòng chọn:
                </label>
                <Select
                  style={{ width: "100%", maxWidth: 600 }}
                  value={selectedBookingId}
                  onChange={setSelectedBookingId}
                  placeholder="Chọn đơn đặt phòng..."
                >
                  {activeBookings.map((booking) => (
                    <Select.Option
                      key={booking.booking_id}
                      value={booking.booking_id}
                    >
                      Mã đặt phòng: #{booking.booking_id} (
                      {booking.checkin_date} → {booking.checkout_date})
                    </Select.Option>
                  ))}
                </Select>
              </div>
            )}

            {/* Show selected booking details and Room Selection */}
            {selectedBookingId &&
              (() => {
                const selectedBooking = activeBookings.find(
                  (b) => b.booking_id === selectedBookingId
                );
                if (!selectedBooking) return null;

                return (
                  <div>
                    <Descriptions
                      column={{ xs: 1, sm: 2, md: 3 }}
                      bordered
                      size="small"
                      style={{ marginBottom: 24 }}
                    >
                      <Descriptions.Item label="Mã đặt phòng">
                        <Tag color="blue">#{selectedBooking.booking_id}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Check-in">
                        <span style={{ color: "#666" }}>
                          {selectedBooking.checkin_date}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Check-out">
                        <span style={{ color: "#666" }}>
                          {selectedBooking.checkout_date}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">
                        <Tag color="green">Đang lưu trú</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Phòng" span={2}>
                        <Space wrap>
                          {selectedBooking.bookingRooms?.map((br) => {
                            const isCheckedIn = br.status === "checked_in";
                            return (
                              <Button
                                key={br.id}
                                type={
                                  selectedRoomId === br.id
                                    ? "primary"
                                    : "default"
                                }
                                disabled={!isCheckedIn}
                                title={
                                  !isCheckedIn ? "Phòng chưa check-in" : ""
                                }
                                onClick={() => setSelectedRoomId(br.id)}
                                style={{
                                  borderRadius: 4,
                                  opacity: isCheckedIn ? 1 : 0.6,
                                }}
                              >
                                Phòng {br.room?.room_number}{" "}
                                {!isCheckedIn && "(Chưa Check-in)"}
                              </Button>
                            );
                          })}
                        </Space>
                        {!selectedRoomId &&
                          selectedBooking.bookingRooms?.length > 1 && (
                            <div
                              style={{
                                marginTop: 8,
                                color: "#ff4d4f",
                                fontSize: 12,
                              }}
                            >
                              * Vui lòng chọn một phòng trước khi gọi dịch vụ
                            </div>
                          )}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                );
              })()}
          </Card>
        )}

        {/* Services List - Always show */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Danh sách dịch vụ</h2>
          {services.length === 0 ? (
            <Card>
              <Empty description="Không có dịch vụ nào" />
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {Array.isArray(services) &&
                services.map((service) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={service.service_id}>
                    <Card
                      hoverable
                      style={{
                        height: "100%",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                      bodyStyle={{ padding: 20 }}
                    >
                      <h3
                        style={{
                          marginBottom: 4,
                          fontSize: 18,
                          color: "#262626",
                        }}
                      >
                        {service.name}
                      </h3>
                      <div
                        style={{
                          color: "#8c8c8c",
                          fontSize: 14,
                          marginBottom: 16,
                        }}
                      >
                        {parseFloat(service.price).toLocaleString("vi-VN")} VNĐ
                        {service.unit && ` / ${service.unit}`}
                      </div>

                      <Space.Compact
                        style={{ width: "100%", marginBottom: 12 }}
                      >
                        <InputNumber
                          min={1}
                          value={quantities[service.service_id] || 1}
                          onChange={(val) =>
                            setQuantities({
                              ...quantities,
                              [service.service_id]: val,
                            })
                          }
                          style={{ width: "60%" }}
                        />
                        <Button
                          type="primary"
                          onClick={() => {
                            if (!selectedRoomId) {
                              message.warning(
                                "Vui lòng chọn phòng cụ thể ở phía trên!"
                              );
                              return;
                            }
                            handleRequestService(service.service_id);
                          }}
                          loading={requesting}
                          style={{ width: "40%", fontWeight: "bold" }}
                        >
                          Gọi
                        </Button>
                      </Space.Compact>

                      <div
                        style={{
                          fontSize: 13,
                          color: "#595959",
                          textAlign: "right",
                          borderTop: "1px solid #f0f0f0",
                          paddingTop: 8,
                        }}
                      >
                        Tổng:{" "}
                        <span style={{ fontWeight: "bold", color: "#1890ff" }}>
                          {(
                            (quantities[service.service_id] || 1) *
                            parseFloat(service.price)
                          ).toLocaleString("vi-VN")}{" "}
                          VNĐ
                        </span>
                      </div>
                    </Card>
                  </Col>
                ))}
            </Row>
          )}
        </div>

        {/* Service History */}
        <Card
          title={
            <Space>
              <HistoryOutlined />
              <span>Lịch sử dịch vụ đã gọi</span>
            </Space>
          }
          bodyStyle={{ padding: 0 }}
        >
          <Table
            rowKey="usage_id"
            columns={historyColumns}
            dataSource={serviceHistory}
            pagination={{ pageSize: 10, position: ["bottomCenter"] }}
            locale={{ emptyText: "Chưa có dịch vụ nào" }}
            style={{ padding: "0 16px" }}
          />

          {/* Footer Financials */}
          {selectedBookingId && financials && (
            <div
              style={{
                padding: "24px",
                borderTop: "1px solid #f0f0f0",
                backgroundColor: "#fafafa",
              }}
            >
              <Row gutter={48} justify="end" align="middle">
                <Col>
                  <Statistic
                    title={
                      <span style={{ color: "#8c8c8c" }}>
                        Tổng chi phí (Phòng + Dịch vụ)
                      </span>
                    }
                    value={financials.total || 0}
                    suffix="VNĐ"
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col>
                  <Statistic
                    title={
                      <span style={{ color: "#8c8c8c" }}>Đã thanh toán</span>
                    }
                    value={financials.totalPaid || 0}
                    suffix="VNĐ"
                    valueStyle={{ fontSize: 20, color: "#52c41a" }}
                  />
                </Col>
                <Col>
                  <Statistic
                    title={
                      <span style={{ color: "#8c8c8c", fontWeight: "bold" }}>
                        Cần thanh toán thêm
                      </span>
                    }
                    value={financials.remainingAmount || 0}
                    suffix="VNĐ"
                    valueStyle={{
                      fontSize: 24,
                      color: "#ff4d4f",
                      fontWeight: "bold",
                    }}
                  />
                </Col>
                {financials.remainingAmount > 0 && (
                  <Col>
                    <Button
                      type="primary"
                      size="large"
                      icon={<DollarOutlined />}
                      onClick={handlePayment}
                      loading={paymentLoading}
                      style={{
                        height: 50,
                        padding: "0 32px",
                        fontSize: 18,
                        borderRadius: 8,
                        fontWeight: "bold",
                      }}
                    >
                      Thanh toán ngay
                    </Button>
                  </Col>
                )}
              </Row>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default UserServiceRequest;
