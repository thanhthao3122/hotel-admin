// src/pages/Rooms.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
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
  Row,
  Col,
  Segmented,
  Tooltip,
  DatePicker,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  BarsOutlined,
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
const { RangePicker } = DatePicker;

const IMAGE_BASE_URL = "http://localhost:5000";

const stateToTag = (state) => {
  const s = (state || "").toLowerCase();
  if (s === "available") return { color: "green", text: "Trống" };
  if (s === "booked") return { color: "blue", text: "Đã đặt" };
  if (s === "occupied") return { color: "red", text: "Đang ở" };
  if (s === "cleaning") return { color: "cyan", text: "Đang dọn" };
  if (s === "maintenance") return { color: "purple", text: "Bảo trì" };
  return { color: "default", text: state || "-" };
};

const fmtDayHeader = (d) => dayjs(d).format("DD/MM");
const fmtDate = (d) => (d ? dayjs(d).format("DD/MM") : "-");

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // viewMode: list | grid | timeline
  const [viewMode, setViewMode] = useState("list");

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRoomType, setFilterRoomType] = useState("");

  // timeline
  const [timelineMode, setTimelineMode] = useState("day"); // day | week | range
  const [timelineDay, setTimelineDay] = useState(dayjs());
  const [timelineRange, setTimelineRange] = useState([
    dayjs().startOf("week"),
    dayjs().startOf("week").add(7, "day"),
  ]);
  const [timelineDays, setTimelineDays] = useState([]);
  const [timelineRooms, setTimelineRooms] = useState([]);

  // modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 100,
    total: 0,
  });

  const roomTypeMap = useMemo(() => {
    const map = {};
    (roomTypes || []).forEach((rt) => (map[rt.room_type_id] = rt.name));
    return map;
  }, [roomTypes]);

  const fetchRoomTypes = async () => {
    try {
      const res = await roomTypeApi.getActive();
      setRoomTypes(res.data || []);
    } catch (error) {
      console.error(error);
      message.error("Không tải được danh sách loại phòng");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await userApi.getAll(1, 100);
      setCustomers(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRooms = async (
    page = pagination.current,
    limit = pagination.pageSize,
    filters = {}
  ) => {
    try {
      setLoading(true);

      const currentFilters = {
        status: filterStatus || undefined,
        room_type_id: filterRoomType || undefined,
        search: searchText || undefined,
        ...filters,
      };

      const res = await roomApi.getAll(page, limit, currentFilters);
      const list = res.data || [];
      const pag = res.pagination;

      setRooms(list);

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
    } catch (error) {
      console.error(error);
      message.error("Không tải được danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  const buildTimelineParams = useCallback(() => {
    if (timelineMode === "day") {
      const start = timelineDay.startOf("day");
      const end = start.add(1, "day"); // end exclusive
      return [start, end];
    }
    if (timelineMode === "week") {
      const start = timelineDay.startOf("week");
      const end = start.add(7, "day");
      return [start, end];
    }
    // range
    const [s, e] = timelineRange;
    const start = (s || dayjs()).startOf("day");
    const end = (e || start.add(7, "day")).startOf("day");
    return [start, end];
  }, [timelineMode, timelineDay, timelineRange]);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const [start, end] = buildTimelineParams();

      const res = await roomApi.getAvailabilityTimeline(
        start.format("YYYY-MM-DD"),
        end.format("YYYY-MM-DD")
      );

      const payload = res.data?.data; // successResponse({ data })
      const days = payload?.days || [];
      const roomsData = payload?.rooms || [];

      setTimelineDays(days);
      setTimelineRooms(roomsData);
    } catch (err) {
      console.error(err);
      message.error(
        err.response?.data?.message || "Không tải được timeline phòng"
      );
    } finally {
      setLoading(false);
    }
  }, [buildTimelineParams]);

  useEffect(() => {
    fetchRoomTypes();
    fetchCustomers();
    fetchRooms(1, pagination.pageSize, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // realtime
  useEffect(() => {
    const refresh = () => {
      if (viewMode === "timeline") fetchTimeline();
      else fetchRooms();
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
  }, [viewMode, fetchTimeline]); // fetchRooms dùng state hiện tại nên không add vào deps để tránh loop

  // Khi chuyển sang timeline -> tự load
  useEffect(() => {
    if (viewMode === "timeline") fetchTimeline();
  }, [viewMode, fetchTimeline]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const keyword = (searchText || "").toLowerCase();
      const matchSearch = String(room.room_number || "")
        .toLowerCase()
        .includes(keyword);

      const matchType = filterRoomType
        ? room.room_type_id === Number(filterRoomType)
        : true;
      return matchSearch && matchType;
    });
  }, [rooms, searchText, filterRoomType]);

  const openCreateModal = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await roomApi.delete(id);
      message.success("Đã xóa phòng");
      if (viewMode === "timeline") fetchTimeline();
      else
        fetchRooms(
          1,
          pagination.pageSize,
          filterStatus ? { status: filterStatus } : {}
        );
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Không xóa được phòng");
    }
  };

  const handleSubmitForm = async (formData) => {
    try {
      if (editingRoom) {
        await roomApi.update(editingRoom.room_id, formData);
        message.success("Cập nhật phòng thành công");
      } else {
        await roomApi.create(formData);
        message.success("Thêm phòng thành công");
      }

      setIsModalOpen(false);
      setEditingRoom(null);

      if (viewMode === "timeline") fetchTimeline();
      else
        fetchRooms(
          1,
          pagination.pageSize,
          filterStatus ? { status: filterStatus } : {}
        );
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Có lỗi khi lưu phòng");
    }
  };

  const resetFilter = () => {
    setSearchText("");
    setFilterStatus("");
    setFilterRoomType("");
    if (viewMode === "timeline") fetchTimeline();
    else fetchRooms(1, pagination.pageSize, {});
  };

  const handleBookingFromRooms = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một phòng");
      return;
    }
    setIsBookingModalOpen(true);
  };

  const handleCreateBooking = async (values) => {
    try {
      await bookingApi.create(values);
      message.success("Tạo đơn đặt phòng thành công");
      setIsBookingModalOpen(false);
      setSelectedRowKeys([]);
      if (viewMode === "timeline") fetchTimeline();
      else fetchRooms();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: (record) => ({ name: record.room_number }),
  };

  // ========= LIST COLUMNS =========
  const renderStatusTag = (status) => {
    const { color, text } = stateToTag(status);
    return <Tag color={color}>{text}</Tag>;
  };

  const columns = [
    {
      title: "Số phòng",
      dataIndex: "room_number",
      key: "room_number",
      sorter: (a, b) =>
        String(a.room_number).localeCompare(String(b.room_number)),
    },
    {
      title: "Kiểu giường",
      dataIndex: "bed_style",
      key: "bed_style",
      render: (v) => v || "Chưa cập nhật",
    },
    {
      title: "Hình ảnh",
      dataIndex: "image",
      key: "image",
      render: (image) => {
        if (!image) return "Không có";
        const imageUrl = image.startsWith("http")
          ? image
          : `${IMAGE_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;

        return (
          <img
            src={imageUrl}
            alt="room"
            style={{
              width: 80,
              height: 60,
              objectFit: "cover",
              borderRadius: 4,
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/80x60?text=No+Image";
            }}
          />
        );
      },
    },
    {
      title: "Loại phòng",
      dataIndex: "room_type_id",
      key: "room_type_id",
      render: (id) => roomTypeMap[id] || "N/A",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => renderStatusTag(status),
      filters: [
        { text: "Trống", value: "available" },
        { text: "Đang ở", value: "occupied" },
        { text: "Đang dọn", value: "cleaning" },
        { text: "Bảo trì", value: "maintenance" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Hiển thị",
      dataIndex: "is_active",
      key: "is_active",
      align: "center",
      render: (value) =>
        value ? <Tag color="green">Hiện</Tag> : <Tag color="red">Ẩn</Tag>,
      filters: [
        { text: "Hiện", value: true },
        { text: "Ẩn", value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 120,
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
            title="Xóa phòng"
            description={`Bạn có chắc muốn xóa phòng ${record.room_number}?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.room_id)}
          >
            <Button size="small" icon={<DeleteOutlined />} danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pager) => {
    const { current, pageSize } = pager;
    setPagination((prev) => ({ ...prev, current, pageSize }));
    fetchRooms(current, pageSize, filterStatus ? { status: filterStatus } : {});
  };

  // ========= TIMELINE TABLE =========
  const timelineColumns = useMemo(() => {
    const base = [
      {
        title: "Phòng",
        dataIndex: "room_number",
        fixed: "left",
        width: 90,
        render: (_, r) => (
          <div>
            <div style={{ fontWeight: 700 }}>{r.room_number}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {r.roomType?.name || roomTypeMap[r.room_type_id]}
            </div>
          </div>
        ),
      },
    ];

    const dayCols = (timelineDays || []).map((d) => ({
      title: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>{fmtDayHeader(d)}</div>
          <div style={{ fontSize: 11, color: "#888" }}>
            {dayjs(d).format("ddd")}
          </div>
        </div>
      ),
      dataIndex: ["timeline", d],
      width: 90,
      align: "center",
      render: (cell, record) => {
        const info = record.timeline?.[d];
        const state = info?.state || "available";
        const { color, text } = stateToTag(state);

        const blocks = info?.blocks || [];
        const tooltipContent =
          blocks.length === 0 ? (
            <Text type="secondary">Không có booking</Text>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {blocks.map((b) => (
                <div
                  key={`${b.booking_room_id}-${b.booking_id}`}
                  style={{ fontSize: 12 }}
                >
                  <div>
                    <b>#{b.booking_id}</b> •{" "}
                    {String(b.br_status || "").toUpperCase()}
                  </div>
                  <div style={{ color: "#666" }}>
                    {fmtDate(b.checkin_date)} → {fmtDate(b.checkout_date)}
                  </div>
                </div>
              ))}
            </div>
          );

        return (
          <Tooltip placement="top" title={tooltipContent}>
            <Tag color={color} style={{ marginRight: 0 }}>
              {text}
            </Tag>
          </Tooltip>
        );
      },
    }));

    return [...base, ...dayCols];
  }, [timelineDays, roomTypeMap]);

  const timelineData = useMemo(() => {
    // filter theo search/type luôn cho timeline
    const keyword = (searchText || "").toLowerCase();
    return (timelineRooms || []).filter((r) => {
      const matchSearch = String(r.room_number || "")
        .toLowerCase()
        .includes(keyword);
      const matchType = filterRoomType
        ? r.room_type_id === Number(filterRoomType)
        : true;
      return matchSearch && matchType;
    });
  }, [timelineRooms, searchText, filterRoomType]);

  // ========= RENDER =========
  return (
    <Card
      title="Quản lý phòng"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Thêm phòng
        </Button>
      }
    >
      {/* Filters + view */}
      <Space
        style={{
          marginBottom: 16,
          justifyContent: "space-between",
          width: "100%",
        }}
        wrap
      >
        <Space wrap>
          <Input
            placeholder="Tìm theo số phòng..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />

          <Select
            placeholder="Lọc theo loại phòng"
            value={filterRoomType || undefined}
            onChange={(value) => setFilterRoomType(value || "")}
            allowClear
            style={{ width: 200 }}
          >
            {roomTypes.map((rt) => (
              <Option key={rt.room_type_id} value={rt.room_type_id}>
                {rt.name}
              </Option>
            ))}
          </Select>

          {/* chỉ dùng cho list/grid */}
          {viewMode !== "timeline" && (
            <Select
              placeholder="Lọc theo trạng thái"
              value={filterStatus || undefined}
              onChange={(value) => {
                const v = value || "";
                setFilterStatus(v);
                fetchRooms(1, pagination.pageSize, v ? { status: v } : {});
              }}
              allowClear
              style={{ width: 180 }}
            >
              <Option value="available">Trống</Option>
              <Option value="occupied">Đang ở</Option>
              <Option value="cleaning">Đang dọn</Option>
              <Option value="maintenance">Bảo trì</Option>
            </Select>
          )}

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleBookingFromRooms}
            style={{
              backgroundColor: "#52c41a",
              display:
                selectedRowKeys.length > 0 && viewMode !== "timeline"
                  ? "inline-block"
                  : "none",
            }}
          >
            Đặt phòng đã chọn ({selectedRowKeys.length})
          </Button>

          <Button icon={<ReloadOutlined />} onClick={resetFilter}>
            Xóa lọc
          </Button>
        </Space>

        <Segmented
          options={[
            { label: "Danh sách", value: "list", icon: <BarsOutlined /> },
            { label: "Lưới", value: "grid", icon: <AppstoreOutlined /> },
            {
              label: "Timeline",
              value: "timeline",
              icon: <CalendarOutlined />,
            },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </Space>

      {/* Timeline controls */}
      {viewMode === "timeline" && (
        <Space style={{ marginBottom: 12 }} wrap>
          <Segmented
            options={[
              { label: "Ngày", value: "day" },
              { label: "Tuần", value: "week" },
              { label: "Khoảng", value: "range" },
            ]}
            value={timelineMode}
            onChange={setTimelineMode}
          />

          {(timelineMode === "day" || timelineMode === "week") && (
            <DatePicker
              value={timelineDay}
              onChange={(v) => v && setTimelineDay(v)}
              format="DD/MM/YYYY"
            />
          )}

          {timelineMode === "range" && (
            <RangePicker
              value={timelineRange}
              onChange={(v) => v && setTimelineRange(v)}
              format="DD/MM/YYYY"
            />
          )}

          <Button type="primary" onClick={fetchTimeline}>
            Xem
          </Button>

          <Text type="secondary">
            (Dữ liệu: {timelineDays?.[0] || "-"} →{" "}
            {timelineDays?.length ? timelineDays[timelineDays.length - 1] : "-"}
            )
          </Text>
        </Space>
      )}

      {/* View Content */}
      {viewMode === "list" && (
        <Table
          rowKey="room_id"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredRooms}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
        />
      )}

      {viewMode === "grid" && (
        <div style={{ minHeight: 320 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 20 }}>Loading...</div>
          ) : (
            <Row gutter={[16, 16]}>
              {filteredRooms.map((room) => {
                const { color, text } = stateToTag(room.status);
                let borderColor = "#d9d9d9";
                if (color === "green") borderColor = "#b7eb8f";
                if (color === "blue") borderColor = "#91caff";
                if (color === "red") borderColor = "#ffccc7";
                if (color === "purple") borderColor = "#d3adf7";
                if (color === "cyan") borderColor = "#87e8de";

                return (
                  <Col xs={12} sm={8} md={6} lg={4} xl={4} key={room.room_id}>
                    <Card
                      hoverable
                      style={{ borderColor, borderTopWidth: 3, height: "100%" }}
                      bodyStyle={{ padding: 12 }}
                      actions={[
                        <Tooltip title="Sửa" key="edit">
                          <EditOutlined onClick={() => openEditModal(room)} />
                        </Tooltip>,
                        <Tooltip title="Xóa" key="delete">
                          <Popconfirm
                            title="Xóa?"
                            onConfirm={() => handleDelete(room.room_id)}
                          >
                            <DeleteOutlined style={{ color: "red" }} />
                          </Popconfirm>
                        </Tooltip>,
                      ]}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>
                          {room.room_number}
                        </div>
                        <div style={{ color: "#888", fontSize: 12 }}>
                          {roomTypeMap[room.room_type_id] ||
                            room.roomType?.name}
                        </div>
                        {room.bed_style && (
                          <div
                            style={{
                              color: "#666",
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            🛏️ {room.bed_style}
                          </div>
                        )}
                        <div style={{ marginTop: 8 }}>
                          <Tag color={color} style={{ marginRight: 0 }}>
                            {text}
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      )}

      {viewMode === "timeline" && (
        <Table
          rowKey={(r) => r.room_id}
          columns={timelineColumns}
          dataSource={timelineData}
          loading={loading}
          pagination={false}
          scroll={{ x: 90 * (timelineDays.length + 1) }}
        />
      )}

      {/* Modal Thêm/Sửa */}
      <RoomForm
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingRoom(null);
        }}
        onSubmit={handleSubmitForm}
        initialValues={editingRoom}
        isEditing={!!editingRoom}
        roomTypes={roomTypes}
      />

      {/* Form Đặt phòng */}
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
};

export default Rooms;
