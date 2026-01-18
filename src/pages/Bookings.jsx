// ✅ Bookings.jsx — FIX desktop "tự update/giật" + gọn đẹp
// - Có cột PHÒNG + thời gian DỰ KIẾN
// - Check-in/Check-out nằm trong cột THỰC TẾ (inline link)
// - Không có nút HUỶ
// - Socket refresh được debounce để không giật liên tục

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Button,
  Card,
  Tag,
  Table,
  Space,
  message,
  Input,
  Select,
  Popconfirm,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import bookingApi from "../api/bookingApi.js";
import userApi from "../api/userApi.js";
import roomApi from "../api/roomApi.js";
import roomTypeApi from "../api/roomTypeApi.js";
import socket from "../utils/socket.js";
import BookingForm from "../components/BookingForm.jsx";

const { Option } = Select;
const { Text, Link } = Typography;

const STATUS_LABEL = {
  pending: "Đang chờ",
  confirmed: "Xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  cancelling: "Khách hủy/Chờ hoàn tiền",
};

const NEXT_STATUS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed"],
  completed: [],
  cancelled: [],
};

const BR_STATUS_UI = {
  pending: { text: "Chờ", color: "default" },
  checked_in: { text: "Đang ở", color: "green" },
  checked_out: { text: "Đã trả", color: "gray" },
  cancelled: { text: "Đã hủy", color: "red" },
};

const fmtDateTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtDateOnly = (v) => (v ? v : "—");

// ✅ render list theo từng phòng, giữ layout ổn định (minHeight)
const renderLines = (bookingRooms, renderLine, { center = false } = {}) => {
  const list = bookingRooms || [];
  if (list.length === 0) return "—";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: center ? "center" : "stretch",
        justifyContent: "center",
      }}
    >
      {list.map((br) => (
        <div
          key={br.id}
          style={{ minHeight: 36, display: "flex", alignItems: "center" }}
        >
          {renderLine(br)}
        </div>
      ))}
    </div>
  );
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ✅ tránh race condition + double fetch
  const lastFetchKeyRef = useRef(0);
  const fetchData = useCallback(
    async (page = pagination.current, limit = pagination.pageSize) => {
      const fetchKey = ++lastFetchKeyRef.current;

      try {
        setLoading(true);

        const [bookingRes, customerRes, roomRes, roomTypeRes] =
          await Promise.all([
            bookingApi.getAll(page, limit),
            userApi.getAll(1, 200),
            roomApi.getAll(1, 300),
            roomTypeApi.getAll(1, 200),
          ]);

        // nếu có fetch mới hơn thì bỏ kết quả cũ (đỡ giật)
        if (fetchKey !== lastFetchKeyRef.current) return;

        setBookings(bookingRes.data || []);
        if (bookingRes.pagination) {
          setPagination((prev) => ({
            ...prev,
            current: bookingRes.pagination.page,
            pageSize: bookingRes.pagination.limit,
            total: bookingRes.pagination.total,
          }));
        }

        setCustomers(customerRes.data || []);
        setRooms(roomRes.data || []);
        setRoomTypes(roomTypeRes.data || []);
      } catch (err) {
        console.error(err);
        message.error("Không tải được dữ liệu đặt phòng");
      } finally {
        if (fetchKey === lastFetchKeyRef.current) setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ SOCKET: debounce refresh để không "tự update" liên tục
  const refreshTimerRef = useRef(null);
  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        fetchData(pagination.current, pagination.pageSize);
      }, 800);
    };

    socket.on("booking_created", scheduleRefresh);
    socket.on("booking_updated", scheduleRefresh);
    socket.on("booking_deleted", scheduleRefresh);
    socket.on("payment_received", scheduleRefresh);
    socket.on("room_updated", scheduleRefresh);
    socket.on("room_status_updated", scheduleRefresh);
    socket.on("booking_room_status_updated", scheduleRefresh);

    return () => {
      socket.off("booking_created", scheduleRefresh);
      socket.off("booking_updated", scheduleRefresh);
      socket.off("booking_deleted", scheduleRefresh);
      socket.off("payment_received", scheduleRefresh);
      socket.off("room_updated", scheduleRefresh);
      socket.off("room_status_updated", scheduleRefresh);
      socket.off("booking_room_status_updated", scheduleRefresh);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [fetchData, pagination.current, pagination.pageSize]);

  const customerMap = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.user_id, c])),
    [customers]
  );

  const filteredBookings = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return bookings.filter((b) => {
      const c = customerMap[b.user_id];
      const matchSearch =
        !keyword ||
        (c?.full_name?.toLowerCase().includes(keyword) ?? false) ||
        (c?.phone?.includes(keyword) ?? false);

      const matchStatus = filterStatus ? b.status === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [bookings, searchText, filterStatus, customerMap]);

  const openCreateModal = () => {
    setEditingBooking(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingBooking) {
        await bookingApi.update(editingBooking.booking_id, data);
        message.success("Cập nhật đặt phòng thành công");
      } else {
        await bookingApi.create(data);
        message.success("Tạo đặt phòng thành công");
      }
      setIsModalOpen(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Có lỗi khi lưu đặt phòng"
      );
      throw error; // Re-throw to prevent reset in BookingForm
    }
  };

  const handleDelete = async (id) => {
    try {
      await bookingApi.delete(id);
      message.success("Đã xóa đặt phòng");
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Không xóa được đặt phòng"
      );
    }
  };

  const updateStatus = async (record, newStatus) => {
    try {
      await bookingApi.updateStatus(record.booking_id, newStatus);
      message.success("Cập nhật trạng thái thành công");
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Cập nhật trạng thái thất bại"
      );
    }
  };

  const updateBookingRoomStatus = async (bookingRoomId, newStatus) => {
    if (!bookingRoomId) return message.error("Thiếu bookingRoomId");
    try {
      await bookingApi.updateBookingRoomStatus(bookingRoomId, {
        status: newStatus,
      });
      message.success(
        newStatus === "checked_in"
          ? "Check-in thành công"
          : "Check-out thành công"
      );
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Cập nhật trạng thái phòng thất bại"
      );
    }
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "booking_id",
      width: 50,
      fixed: "left",
      align: "center",
      render: (id) => <Tag color="blue">{id}</Tag>,
    },
    {
      title: "Khách hàng",
      width: 130,
      ellipsis: true,
      render: (_, record) => {
        const c = customerMap[record.user_id];
        return c ? (
          <div style={{ lineHeight: 1.2 }}>
            <div
              style={{
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c.full_name}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>{c.phone}</div>
          </div>
        ) : (
          "N/A"
        );
      },
    },

    // ✅ PHÒNG + DỰ KIẾN
    {
      title: "Phòng",
      width: 200,
      render: (_, record) =>
        renderLines(record.bookingRooms, (br) => {
          const roomNo = br.room?.room_number || "—";
          const st = (br.status || "pending").toLowerCase();
          const ui = BR_STATUS_UI[st] || BR_STATUS_UI.pending;

          return (
            <div
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #f0f0f0",
                borderRadius: 10,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text strong>{`Phòng ${roomNo}`}</Text>
                <Tag color={ui.color} style={{ margin: 0 }}>
                  {ui.text}
                </Tag>
              </div>

              <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
                {fmtDateOnly(br.checkin_date)} → {fmtDateOnly(br.checkout_date)}
              </div>
            </div>
          );
        }),
    },

    // ✅ Check-in THỰC TẾ (nút nằm ở đây)
    {
      title: "Check-in",
      width: 105,
      align: "center",

      render: (_, record) =>
        renderLines(
          record.bookingRooms,
          (br) => {
            const locked =
              record.status === "cancelled" || record.status === "completed";
            const brStatus = (br.status || "pending").toLowerCase();

            if (br.actual_checkin)
              return (
                <div
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    border: "1px solid #f0f0f0",
                    borderRadius: 10,
                    background: "#fff",
                  }}
                >
                  {" "}
                  <Text>{fmtDateTime(br.actual_checkin)}</Text>
                </div>
              );

            const canCheckIn = brStatus === "pending" && !locked;
            const today = dayjs().startOf("day");
            const checkin = dayjs(br.checkin_date).startOf("day");
            const disabled = today.isBefore(checkin);
            return canCheckIn ? (
              <Button
                disabled={disabled}
                onClick={() => updateBookingRoomStatus(br.id, "checked_in")}
              >
                Check-in
              </Button>
            ) : (
              <Text type="secondary">-</Text>
            );
          },
          { center: true }
        ),
    },

    // ✅ Check-out THỰC TẾ (nút nằm ở đây)
    {
      title: "Check-out",
      width: 105,
      align: "center",
      render: (_, record) =>
        renderLines(
          record.bookingRooms,
          (br) => {
            const locked =
              record.status === "cancelled" || record.status === "completed";
            const brStatus = (br.status || "pending").toLowerCase();

            if (br.actual_checkout)
              return (
                <div
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    border: "1px solid #f0f0f0",
                    borderRadius: 10,
                    background: "#fff",
                  }}
                >
                  <Text>{fmtDateTime(br.actual_checkout)}</Text>
                </div>
              );

            const canCheckOut = brStatus === "checked_in" && !locked;

            return canCheckOut ? (
              <Button
                onClick={() => updateBookingRoomStatus(br.id, "checked_out")}
              >
                Check-out
              </Button>
            ) : (
              <Text type="secondary">-</Text>
            );
          },
          { center: true }
        ),
    },

    {
      title: "Nguồn",
      dataIndex: "source",
      width: 75,
      align: "center",
      render: (src) => (
        <Tag color={src === "admin" ? "purple" : "blue"}>
          {src?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "TT",
      dataIndex: "payment_method",
      width: 70,
      align: "center",
      render: (method) => (
        <Tag color={method === "pay_later" ? "cyan" : "green"}>
          {method === "pay_later" ? "SAU" : "ONL"}
        </Tag>
      ),
    },
    {
      title: "Tổng",
      dataIndex: "total_price",
      width: 110,
      align: "right",
      render: (v) => (v ? Number(v).toLocaleString("vi-VN") + " đ" : "0 đ"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 220,
      render: (st, record) => {
        const cur = st ? st.toLowerCase() : "unknown";
        const next = NEXT_STATUS[cur] || [];
        const disabled = next.length === 0;
        const options = [cur, ...next.filter((x) => x !== cur)];

        return (
          <Space direction="vertical" size={0}>
            <Select
              value={cur}
              style={{ width: 200 }}
              disabled={disabled}
              onChange={(val) => updateStatus(record, val)}
            >
              {options.map((s) => (
                <Select.Option key={s} value={s}>
                  {STATUS_LABEL[s] || s}
                </Select.Option>
              ))}
            </Select>

            {/* HIỂN THỊ TAG HOÀN TIỀN NẾU CÓ */}
            {record.invoice?.status === "refund" && (
              <Tag
                color="error"
                style={{ marginTop: "4px", textAlign: "center", width: "100%" }}
              >
                ĐÃ HOÀN TIỀN
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Hành động",
      width: 130,
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingBooking(r);
              setIsModalOpen(true);
            }}
            disabled={r.status === "completed"}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa đặt phòng?"
            onConfirm={() => handleDelete(r.booking_id)}
            okText="Xóa"
            cancelText="Hủy"
            placement="topRight"
            disabled={r.status !== "cancelled"}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={r.status !== "cancelled"}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quản lý đặt phòng"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Tạo đặt phòng
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo tên KH hoặc SĐT..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />

        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 160 }}
          value={filterStatus || undefined}
          onChange={(v) => setFilterStatus(v)}
        >
          <Option value="pending">Đang chờ</Option>
          <Option value="confirmed">Xác nhận</Option>
          <Option value="completed">Hoàn thành</Option>
          <Option value="cancelled">Đã hủy</Option>
        </Select>
      </Space>

      <Table
        rowKey="booking_id"
        columns={columns}
        dataSource={filteredBookings}
        loading={loading}
        scroll={{ x: 1200 }}
        tableLayout="fixed"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20"],
        }}
        // ✅ chỉ update state, KHÔNG gọi fetchData ở đây để tránh double-fetch
        onChange={(pager) => {
          const { current, pageSize } = pager;
          setPagination((prev) => ({ ...prev, current, pageSize }));
        }}
      />

      <BookingForm
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={editingBooking}
        customers={customers}
        rooms={rooms}
        roomTypes={roomTypes}
        isEditing={!!editingBooking}
      />
    </Card>
  );
};

export default Bookings;
