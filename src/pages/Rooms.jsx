// src/pages/Rooms.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

import {
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Popconfirm,
  message,
  Tooltip,
  DatePicker,
  Typography,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

import roomApi from "../api/roomApi.js";
import roomTypeApi from "../api/roomTypeApi.js";
import userApi from "../api/userApi.js";
import bookingApi from "../api/bookingApi.js";
import socket from "../utils/socket.js";
import BookingForm from "../components/BookingForm.jsx";
import RoomForm from "../components/RoomForm.jsx";

const { Option } = Select;
const { Text } = Typography;

const IMAGE_BASE_URL = "http://localhost:5000";

/**
 * ✅ Bóc list an toàn cho mọi kiểu axiosClient:
 * - res.data = {success,message,data:[...]}
 * - res = {success,message,data:[...]} (unwrap)
 * - res.data = [...]
 */
const unwrapList = (res) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;

  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;

  return [];
};

const stateToTag = (state) => {
  const s = String(state || "").toLowerCase();
  if (s === "available") return { color: "green", text: "Trống" };
  if (s === "booked") return { color: "blue", text: "Đã đặt" };
  if (s === "occupied") return { color: "red", text: "Đang ở" };
  if (s === "cleaning") return { color: "cyan", text: "Đang dọn" };
  if (s === "maintenance") return { color: "purple", text: "Bảo trì" };
  return { color: "default", text: state || "-" };
};

const brStatusToTag = (brStatus) => {
  const s = String(brStatus || "").toLowerCase();
  if (s === "checked_in") return { color: "red", text: "Đang ở" };
  if (s === "checked_out") return { color: "cyan", text: "Đã trả" };
  if (s === "cancelled") return { color: "default", text: "Hủy" };
  return { color: "blue", text: "Đã đặt" }; // pending / default
};

const fmt = (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "-");
const fmtYMD = (d) => (d ? dayjs(d).format("YYYY-MM-DD") : null);

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRoomType, setFilterRoomType] = useState("");

  // ✅ 2 DatePicker (không dùng RangePicker)
  const [fromDate, setFromDate] = useState(dayjs().startOf("day"));
  const [toDate, setToDate] = useState(dayjs().add(1, "day").startOf("day"));

  // map room_id -> info booking trong khoảng
  const [bookingMap, setBookingMap] = useState({});

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // modals
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const roomTypeMap = useMemo(() => {
    const map = {};
    (roomTypes || []).forEach((rt) => (map[rt.room_type_id] = rt.name));
    return map;
  }, [roomTypes]);

  const disabledDate = (current) => {
    if (!current) return false;
    // chặn chọn năm quá xa (tránh nhảy loạn)
    return (
      current.isBefore(dayjs("2000-01-01")) ||
      current.isAfter(dayjs("2100-12-31"))
    );
  };

  const fetchRoomTypes = useCallback(async () => {
    try {
      const res = await roomTypeApi.getActive();
      setRoomTypes(unwrapList(res));
    } catch (e) {
      console.error(e);
      message.error("Không tải được loại phòng");
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await userApi.getAll(1, 200);
      setCustomers(unwrapList(res));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchRooms = useCallback(
    async (page = pagination.current, limit = pagination.pageSize) => {
      try {
        setLoading(true);

        const filters = {
          status: filterStatus || undefined,
          room_type_id: filterRoomType || undefined,
          search: searchText || undefined,
        };

        const res = await roomApi.getAll(page, limit, filters);

        // ✅ quan trọng: API của bạn trả data trong res.data.data
        const list = unwrapList(res);
        setRooms(list);

        // pagination (nếu backend có)
        const pag = res?.pagination || res?.data?.pagination;
        if (pag) {
          setPagination({
            current: pag.page,
            pageSize: pag.limit,
            total: pag.total,
          });
        } else {
          setPagination((prev) => ({
            ...prev,
            current: page,
            pageSize: limit,
            total: list.length,
          }));
        }
      } catch (e) {
        console.error(e);
        message.error(
          e?.response?.data?.message || "Không tải được danh sách phòng"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      filterStatus,
      filterRoomType,
      searchText,
      pagination.current,
      pagination.pageSize,
    ]
  );

  const fetchBookingRange = useCallback(async () => {
    try {
      const start = fromDate?.startOf("day");
      const end = toDate?.startOf("day");
      if (!start || !end) return;

      if (end.isBefore(start)) {
        message.warning("Ngày đến phải >= ngày từ");
        return;
      }

      const res = await roomApi.getAvailabilityTimeline(
        fmtYMD(start),
        fmtYMD(end)
      );
      const roomsData = unwrapList(res);

      const map = {};
      roomsData.forEach((r) => {
        const blocks = Array.isArray(r.blocked_by) ? r.blocked_by : [];
        if (!blocks.length) {
          map[r.room_id] = { type: "free" };
          return;
        }

        // ưu tiên checked_in nếu có
        const picked =
          blocks.find(
            (b) => String(b.br_status).toLowerCase() === "checked_in"
          ) || blocks[0];

        const st = brStatusToTag(picked.br_status);

        map[r.room_id] = {
          type: "busy",
          color: st.color,
          label: st.text,
          text: `${picked.checkin_date} → ${picked.checkout_date}`,
          tooltip: (
            <div style={{ fontSize: 12, lineHeight: 1.4 }}>
              <div>
                <b>Booking #{picked.booking_id}</b>
              </div>
              <div>
                Booking status:{" "}
                <b>{String(picked.booking_status || "").toUpperCase()}</b>
              </div>
              <div>
                BR status: <b>{String(picked.br_status || "").toUpperCase()}</b>
              </div>
              <div>
                {picked.checkin_date} → {picked.checkout_date}
              </div>
            </div>
          ),
        };
      });

      setBookingMap(map);
    } catch (e) {
      console.error(e);
      setBookingMap({});
      message.error(e?.response?.data?.message || "Không tải được lịch đặt");
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchRoomTypes();
    fetchCustomers();
    fetchRooms(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchBookingRange();
  }, [fetchBookingRange]);

  // realtime refresh
  useEffect(() => {
    const refresh = () => {
      fetchRooms();
      fetchBookingRange();
    };

    socket.on("room_created", refresh);
    socket.on("room_updated", refresh);
    socket.on("room_status_updated", refresh);
    socket.on("room_deleted", refresh);

    socket.on("booking_created", refresh);
    socket.on("booking_updated", refresh);
    socket.on("booking_room_status_updated", refresh);

    return () => {
      socket.off("room_created", refresh);
      socket.off("room_updated", refresh);
      socket.off("room_status_updated", refresh);
      socket.off("room_deleted", refresh);

      socket.off("booking_created", refresh);
      socket.off("booking_updated", refresh);
      socket.off("booking_room_status_updated", refresh);
    };
  }, [fetchRooms, fetchBookingRange]);

  const filteredRooms = useMemo(() => {
    const kw = (searchText || "").toLowerCase().trim();
    return (rooms || []).filter((r) => {
      const matchSearch = String(r.room_number || "")
        .toLowerCase()
        .includes(kw);
      const matchType = filterRoomType
        ? r.room_type_id === Number(filterRoomType)
        : true;
      const matchStatus = filterStatus
        ? String(r.status) === String(filterStatus)
        : true;
      return matchSearch && matchType && matchStatus;
    });
  }, [rooms, searchText, filterRoomType, filterStatus]);

  const openCreateModal = () => {
    setEditingRoom(null);
    setIsRoomModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setIsRoomModalOpen(true);
  };

  const handleDelete = async (roomId) => {
    try {
      await roomApi.delete(roomId);
      message.success("Đã xóa phòng");
      fetchRooms(1, pagination.pageSize);
      fetchBookingRange();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Không xóa được phòng");
    }
  };

  const handleSubmitRoomForm = async (formData) => {
    try {
      if (editingRoom) {
        await roomApi.update(editingRoom.room_id, formData);
        message.success("Cập nhật phòng thành công");
      } else {
        await roomApi.create(formData);
        message.success("Thêm phòng thành công");
      }
      setIsRoomModalOpen(false);
      setEditingRoom(null);
      fetchRooms(1, pagination.pageSize);
      fetchBookingRange();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Có lỗi khi lưu phòng");
    }
  };

  const handleBookingFromRooms = () => {
    if (!selectedRowKeys.length)
      return message.warning("Vui lòng chọn ít nhất 1 phòng");
    setIsBookingModalOpen(true);
  };

  const handleCreateBooking = async (values) => {
    try {
      await bookingApi.create(values);
      message.success("Tạo đơn đặt phòng thành công");
      setIsBookingModalOpen(false);
      setSelectedRowKeys([]);
      fetchRooms();
      fetchBookingRange();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const columns = [
    {
      title: "Số phòng",
      dataIndex: "room_number",
      key: "room_number",
      width: 110,
      sorter: (a, b) =>
        String(a.room_number).localeCompare(String(b.room_number)),
      render: (v) => (
        <Text strong style={{ fontSize: 14 }}>
          {v}
        </Text>
      ),
    },
    {
      title: "Loại phòng",
      dataIndex: "room_type_id",
      key: "room_type_id",
      width: 200,
      render: (id, r) => r.roomType?.name || roomTypeMap[id] || "N/A",
    },
    {
      title: "Kiểu giường",
      dataIndex: "bed_style",
      key: "bed_style",
      width: 160,
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => {
        const { color, text } = stateToTag(status);
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: (
        <Space size={6}>
          <CalendarOutlined />
          <span>Lịch đặt (trong khoảng)</span>
        </Space>
      ),
      key: "book_range",
      width: 280,
      render: (_, r) => {
        const info = bookingMap?.[r.room_id];
        if (!info) return <Text type="secondary">—</Text>;

        if (info.type === "free") {
          return (
            <Tag color="green" style={{ marginRight: 0 }}>
              Trống
            </Tag>
          );
        }

        return (
          <Tooltip title={info.tooltip}>
            <Tag color={info.color || "blue"} style={{ marginRight: 0 }}>
              {info.label}: {info.text}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Hình",
      dataIndex: "image",
      key: "image",
      width: 120,
      render: (image) => {
        if (!image) return <Text type="secondary">—</Text>;
        const url = image.startsWith("http")
          ? image
          : `${IMAGE_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
        return (
          <img
            src={url}
            alt="room"
            style={{
              width: 92,
              height: 64,
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid #f0f0f0",
            }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://via.placeholder.com/92x64?text=No+Image";
            }}
          />
        );
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 170,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa phòng?"
            description={`Bạn chắc chắn muốn xóa phòng ${record.room_number}?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.room_id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 18, fontWeight: 800 }}>Quản lý phòng</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Danh sách phòng + lịch đặt theo khoảng ngày
          </Text>
        </Space>
      }
      extra={
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button
              type="primary"
              style={{ background: "#52c41a" }}
              onClick={handleBookingFromRooms}
            >
              Đặt phòng đã chọn ({selectedRowKeys.length})
            </Button>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Thêm phòng
          </Button>
        </Space>
      }
      bodyStyle={{ paddingTop: 12 }}
    >
      {/* FILTER BAR */}
      <div
        style={{
          background: "#fafafa",
          border: "1px solid #f0f0f0",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Input
              placeholder="Tìm theo số phòng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 220 }}
            />

            <Select
              placeholder="Loại phòng"
              value={filterRoomType || undefined}
              onChange={(v) => setFilterRoomType(v || "")}
              allowClear
              style={{ width: 200 }}
            >
              {roomTypes.map((rt) => (
                <Option key={rt.room_type_id} value={rt.room_type_id}>
                  {rt.name}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Trạng thái phòng"
              value={filterStatus || undefined}
              onChange={(v) => setFilterStatus(v || "")}
              allowClear
              style={{ width: 180 }}
            >
              <Option value="available">Trống</Option>
              <Option value="booked">Đã đặt</Option>
              <Option value="occupied">Đang ở</Option>
              <Option value="cleaning">Đang dọn</Option>
              <Option value="maintenance">Bảo trì</Option>
            </Select>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchRooms(1, pagination.pageSize)}
            >
              Tải lại
            </Button>
          </Space>

          <Space wrap align="center">
            <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
              Xem lịch đặt:
            </Text>

            <DatePicker
              value={fromDate}
              onChange={(v) => {
                if (!v) return;
                const d = v.startOf("day");
                setFromDate(d);
                if (toDate && toDate.isBefore(d)) setToDate(d);
              }}
              format="DD/MM/YYYY"
              allowClear={false}
              inputReadOnly
              disabledDate={disabledDate}
              getPopupContainer={(trigger) => trigger.parentElement}
              style={{ width: 150 }}
            />

            <Text type="secondary">→</Text>

            <DatePicker
              value={toDate}
              onChange={(v) => {
                if (!v) return;
                const d = v.startOf("day");
                setToDate(d);
                if (fromDate && d.isBefore(fromDate)) setFromDate(d);
              }}
              format="DD/MM/YYYY"
              allowClear={false}
              inputReadOnly
              disabledDate={disabledDate}
              getPopupContainer={(trigger) => trigger.parentElement}
              style={{ width: 150 }}
            />

            <Button type="primary" onClick={fetchBookingRange}>
              Xem
            </Button>
          </Space>
        </Space>

        <Divider style={{ margin: "12px 0" }} />

        <Text type="secondary">
          Đang xem lịch: <b>{fmt(fromDate)}</b> → <b>{fmt(toDate)}</b>
        </Text>
      </div>

      {/* TABLE */}
      <Table
        rowKey="room_id"
        columns={columns}
        dataSource={filteredRooms}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        onChange={(pager) => {
          setPagination((p) => ({
            ...p,
            current: pager.current,
            pageSize: pager.pageSize,
          }));
          fetchRooms(pager.current, pager.pageSize);
        }}
        scroll={{ x: 1200 }}
      />

      {/* MODALS */}
      <RoomForm
        open={isRoomModalOpen}
        onCancel={() => {
          setIsRoomModalOpen(false);
          setEditingRoom(null);
        }}
        onSubmit={handleSubmitRoomForm}
        initialValues={editingRoom}
        isEditing={!!editingRoom}
        roomTypes={roomTypes}
      />

      <BookingForm
        open={isBookingModalOpen}
        onCancel={() => setIsBookingModalOpen(false)}
        onSubmit={handleCreateBooking}
        customers={customers}
        rooms={rooms}
        roomTypes={roomTypes}
        isEditing={false}
        initialValues={{ room_ids: selectedRowKeys }}
      />
    </Card>
  );
}
