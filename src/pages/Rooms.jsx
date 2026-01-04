// src/pages/Rooms.jsx
import { useEffect, useMemo, useState } from "react";
import dayjs from 'dayjs';
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
  Avatar,
  Tooltip,
  DatePicker
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  CalendarOutlined,
  TagOutlined,
  AppstoreOutlined,
  BarsOutlined,
} from "@ant-design/icons";
import roomApi from "../api/roomApi.js";
import roomTypeApi from "../api/roomTypeApi.js";
import userApi from "../api/userApi.js";
import bookingApi from "../api/bookingApi.js";
import socket from "../utils/socket.js";
import BookingForm from "../components/BookingForm.jsx";
import RoomForm from "../components/RoomForm.jsx";

const { Option } = Select;

// ✅ URL base để load ảnh từ backend
const IMAGE_BASE_URL = "http://localhost:5000";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'list' | 'grid'

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRoomType, setFilterRoomType] = useState("");
  const [filterDate, setFilterDate] = useState(dayjs());

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

  // map room_type_id -> name
  const roomTypeMap = useMemo(() => {
    const map = {};
    if (Array.isArray(roomTypes)) {
      roomTypes.forEach((rt) => {
        map[rt.room_type_id] = rt.name;
      });
    }
    return map;
  }, [roomTypes]);

  // ✅ load danh sách loại phòng
  const fetchRoomTypes = async () => {
    try {
      const res = await roomTypeApi.getActive(); // res = { success, data }
      console.log("Fetched room types:", res.data);

      setRoomTypes(res.data || []);
    } catch (error) {
      console.error(error);
      message.error("Không tải được danh sách loại phòng");
    }
  };

  // ✅ Load danh sách phòng (có thể kèm filters: { status: 'booked' })
  const fetchRooms = async (
    page = pagination.current,
    limit = pagination.pageSize,
    filters = {},
    date = filterDate
  ) => {
    try {
      setLoading(true);

      // Sử dụng filterDate state nếu không được truyền vào thủ công
      // Nếu filters có chứa status, type,... thì ưu tiên
      const currentFilters = {
        status: filterStatus,
        room_type_id: filterRoomType,
        search: searchText,
        ...filters
      };

      const res = await roomApi.getAll(
        page,
        limit,
        currentFilters,
        date ? date.format('YYYY-MM-DD') : null
      );

      const list = res.data || [];
      const pag = res.pagination;
      console.log("Fetched rooms:", list);
      console.log("Pagination:", pag);

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

  // ✅ load khách hàng cho form đặt phòng
  const fetchCustomers = async () => {
    try {
      const res = await userApi.getAll(1, 100);
      setCustomers(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
    fetchCustomers();
    // mặc định load tất cả phòng
    fetchRooms(1, pagination.pageSize, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Real-time: Lắng nghe sự kiện từ Server
  useEffect(() => {
    socket.on("room_created", () => {
      fetchRooms();
      message.info("Có phòng mới vừa được tạo!");
    });

    socket.on("room_updated", () => {
      fetchRooms();
    });

    socket.on("room_status_updated", (data) => {
      // Tìm số phòng để thông báo cho dễ hiểu
      const room = rooms.find((r) => r.room_id === data.room_id);
      const roomNum = room ? `phòng ${room.room_number}` : "một phòng";
      message.info(`Trạng thái ${roomNum} vừa thay đổi thành: ${data.status}`);
      fetchRooms();
    });

    socket.on("room_deleted", () => {
      fetchRooms();
    });

    return () => {
      socket.off("room_created");
      socket.off("room_updated");
      socket.off("room_status_updated");
      socket.off("room_deleted");
    };
  }, [rooms, pagination.pageSize]);

  // FE chỉ lọc thêm search + loại phòng; trạng thái đã lọc ở backend
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const keyword = searchText.toLowerCase();
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

      const filters = filterStatus ? { status: filterStatus } : {};
      // sau khi xóa, load lại theo status hiện tại
      fetchRooms(1, pagination.pageSize, filters);
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không xóa được phòng";
      message.error(msg);
    }
  };

  // ✅ nhận values từ form (đã là FormData từ RoomForm)
  const handleSubmitForm = async (formData) => {
    try {
      if (editingRoom) {
        await roomApi.update(editingRoom.room_id, formData);
        message.success("Cập nhật phòng thành công");
      } else {
        await roomApi.create(formData);
        message.success("Thêm phòng thành công");
      }

      // 🔹 Giữ nguyên filter status hiện tại (ví dụ đang xem 'Đã đặt')
      const filters = filterStatus ? { status: filterStatus } : {};
      await fetchRooms(1, pagination.pageSize, filters);

      setIsModalOpen(false);
      setEditingRoom(null);
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Có lỗi khi lưu phòng";
      message.error(msg);
    }
  };

  const resetFilter = () => {
    setSearchText("");
    setFilterStatus("");
    setFilterRoomType("");
    fetchRooms(1, pagination.pageSize, {}); // load lại tất cả phòng
  };

  const renderStatusTag = (status) => {
    let color = "default";
    let text = status;

    switch (status) {
      case "available":
        color = "green";
        text = "Trống";
        break;
      case "booked":
        color = "orange";
        text = "Đã đặt";
        break;
      case "occupied":
        color = "red";
        text = "Đang ở";
        break;
      case "cleaning":
        color = "blue";
        text = "Đang dọn";
        break;
      case "maintenance":
        color = "purple";
        text = "Bảo trì";
        break;
      default:
        break;
    }

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
      render: (text) => text || "Chưa xác định",
    },

    {
      title: "Hình ảnh",
      dataIndex: "image",
      key: "image",
      render: (image) => {
        if (!image) return "Không có";
        // Ensure image path starts with / if it doesn't, and handle full URLs
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
      title: "Kiểu giường",
      dataIndex: "bed_style",
      render: (v) => v || "Chưa cập nhật",
    },
    {
      title: "Loại phòng",
      dataIndex: "room_type_id",
      key: "room_type_id",
      render: (room_type_id) => roomTypeMap[room_type_id] || "N/A",
    },

    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 250,
      render: (status, record) => {
        const tag = renderStatusTag(status);

        // Show booking info if available and status indicates occupancy
        if (['booked', 'occupied', 'cleaning'].includes(status) && record.bookings && record.bookings.length > 0) {
          return (
            <Space direction="vertical" size={1} style={{ width: '100%' }}>
              <div style={{ marginBottom: 4 }}>{tag}</div>
              {record.bookings.map((booking, index) => {
                const user = booking.user;
                const pivot = booking.BookingRoom || {};
                const cin = pivot.checkin_date ? dayjs(pivot.checkin_date) : dayjs(booking.checkin_date);
                const cout = pivot.checkout_date ? dayjs(pivot.checkout_date) : dayjs(booking.checkout_date);

                // Determine color based on booking status
                let statusColor = '#8c8c8c';
                if (booking.status === 'checked_in') statusColor = '#ff4d4f';
                else if (booking.status === 'confirmed') statusColor = '#1890ff';

                return (
                  <div key={booking.booking_id} style={{ fontSize: '12px', color: '#555', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px', marginBottom: 4, borderLeft: `3px solid ${statusColor}` }}>
                    <div style={{ marginBottom: 2, display: 'flex', alignItems: 'center' }}>
                      <UserOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                      <span style={{ fontWeight: 500 }}>{user?.full_name || 'Khách vãng lai'}</span>
                    </div>
                    <div style={{ marginBottom: 2, display: 'flex', alignItems: 'center' }}>
                      <CalendarOutlined style={{ marginRight: 6, color: '#faad14' }} />
                      <span>{cin.format('DD/MM')} - {cout.format('DD/MM')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <TagOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                      <span style={{ color: '#8c8c8c' }}>#{booking.booking_id}</span>
                    </div>
                  </div>
                );
              })}
            </Space>
          );
        }
        return tag;
      },
      filters: [
        { text: "Trống", value: "available" },
        { text: "Đã đặt", value: "booked" },
        { text: "Đang ở", value: "occupied" },
        { text: "Đang dọn", value: "cleaning" },
        { text: "Bảo trì", value: "maintenance" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Trạng thái",
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
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: "#ff4d4f", //đỏ dịu
                borderColor: "#ff4d4f",
                color: "#fff",
              }}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pager) => {
    const { current, pageSize } = pager;
    setPagination((prev) => ({
      ...prev,
      current,
      pageSize,
    }));

    const filters = filterStatus ? { status: filterStatus } : {};
    fetchRooms(current, pageSize, filters);
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
      fetchRooms(); // Tải lại để cập nhật trạng thái phòng
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: (record) => ({
      name: record.room_number,
    }),
  };

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
      {/* Filter / search */}
      {/* Filter / search */}
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }} wrap>
        <Space wrap>
          <Input
            placeholder="Tìm theo số phòng..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => fetchRooms(1, pagination.pageSize, { search: searchText })}
            allowClear
            style={{ width: 200 }}
          />

          <Select
            placeholder="Lọc theo loại phòng"
            value={filterRoomType || undefined}
            onChange={(value) => {
              const v = value || "";
              setFilterRoomType(v);
              fetchRooms(1, pagination.pageSize, { room_type_id: v });
            }}
            allowClear
            style={{ width: 200 }}
          >
            {roomTypes.map((rt) => (
              <Option key={rt.room_type_id} value={rt.room_type_id}>
                {rt.name}
              </Option>
            ))}
          </Select>

          {/* 🔥 Lọc theo trạng thái -> gọi API /rooms?status=... */}
          <Select
            placeholder="Lọc theo trạng thái"
            value={filterStatus || undefined}
            onChange={(value) => {
              const v = value || "";
              setFilterStatus(v);

              const filters = v ? { status: v } : {};
              // đổi trạng thái -> reset về trang 1
              fetchRooms(1, pagination.pageSize, filters);
            }}
            allowClear
            style={{ width: 180 }}
          >
            <Option value="available">Trống</Option>
            <Option value="booked">Đã đặt</Option>
            <Option value="occupied">Đang ở</Option>
            <Option value="cleaning">Đang dọn</Option>
            <Option value="maintenance">Bảo trì</Option>
          </Select>

          <DatePicker
            placeholder="Chọn ngày kiểm tra"
            value={filterDate}
            onChange={(date) => {
              setFilterDate(date);
              // Khi đổi ngày, load lại dữ liệu cho ngày đó
              fetchRooms(1, pagination.pageSize, {
                status: filterStatus,
                room_type_id: filterRoomType,
                search: searchText
              }, date);
            }}
            format="DD/MM/YYYY"
            allowClear={false}
            style={{ width: 160 }}
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleBookingFromRooms}
            style={{
              backgroundColor: "#52c41a",
              display: selectedRowKeys.length > 0 ? "inline-block" : "none",
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
            { label: 'Danh sách', value: 'list', icon: <BarsOutlined /> },
            { label: 'Lưới', value: 'grid', icon: <AppstoreOutlined /> },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </Space>

      {/* View Content */}
      {viewMode === 'list' ? (
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
      ) : (
        <div style={{ minHeight: 400 }}>
          {loading ? <div style={{ textAlign: 'center', padding: 20 }}>Loading...</div> : (
            <Row gutter={[16, 16]}>
              {filteredRooms.map(room => {
                // Determine visual styles based on status
                let borderColor = '#d9d9d9';
                let headerColor = '#f5f5f5';
                let statusText = 'Trống';
                let statusColor = 'default';

                switch (room.status) {
                  case 'available':
                    borderColor = '#b7eb8f'; // green
                    headerColor = '#f6ffed';
                    statusText = 'Trống';
                    statusColor = 'success';
                    break;
                  case 'booked':
                    borderColor = '#ffd591'; // orange
                    headerColor = '#fff7e6';
                    statusText = 'Đã đặt';
                    statusColor = 'warning';
                    break;
                  case 'occupied':
                    borderColor = '#ffccc7'; // red
                    headerColor = '#fff1f0';
                    statusText = 'Đang ở';
                    statusColor = 'error';
                    break;
                  case 'cleaning':
                    borderColor = '#91caff'; // blue
                    headerColor = '#e6f7ff';
                    statusText = 'Đang dọn';
                    statusColor = 'processing';
                    break;
                  case 'maintenance':
                    borderColor = '#d3adf7'; // purple
                    headerColor = '#f9f0ff';
                    statusText = 'Bảo trì';
                    statusColor = 'purple';
                    break;
                }

                // Active booking info
                let bookingInfo = null;
                if (['booked', 'occupied', 'cleaning'].includes(room.status) && room.bookings && room.bookings.length > 0) {
                  bookingInfo = (
                    <div style={{ fontSize: '12px', marginTop: 8 }}>
                      {room.bookings.map((bk, index) => {
                        const usr = bk.user;
                        const pivot = bk.BookingRoom || {};
                        const cin = pivot.checkin_date ? dayjs(pivot.checkin_date) : dayjs(bk.checkin_date);
                        const cout = pivot.checkout_date ? dayjs(pivot.checkout_date) : dayjs(bk.checkout_date);

                        // Determine color based on booking status
                        let statusColor = '#8c8c8c';
                        if (bk.status === 'checked_in') statusColor = '#ff4d4f'; // Red for occupied
                        else if (bk.status === 'confirmed') statusColor = '#1890ff'; // Blue for booked/incoming

                        return (
                          <div key={bk.booking_id} style={{
                            marginBottom: 4,
                            padding: 4,
                            border: '1px solid #f0f0f0',
                            borderRadius: 4,
                            background: index % 2 === 0 ? '#fafafa' : '#fff'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, marginRight: 6 }}></span>
                              <UserOutlined style={{ marginRight: 4, fontSize: 10, color: '#1890ff' }} />
                              <strong style={{ fontSize: 11 }}>{usr?.full_name || 'Khách vãng lai'}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                              <CalendarOutlined style={{ marginRight: 4, fontSize: 10, color: '#faad14' }} />
                              <span style={{ fontSize: 11 }}>{cin.format('DD/MM')} - {cout.format('DD/MM')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <TagOutlined style={{ marginRight: 4, fontSize: 10, color: '#52c41a' }} />
                              <span style={{ fontSize: 10, color: '#8c8c8c' }}>#{bk.booking_id}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <Col xs={12} sm={8} md={6} lg={4} xl={4} key={room.room_id}>
                    <Card
                      hoverable
                      style={{
                        borderColor: borderColor,
                        borderTopWidth: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      bodyStyle={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}
                      actions={[
                        <Tooltip title="Sửa"><EditOutlined key="edit" onClick={() => openEditModal(room)} /></Tooltip>,
                        <Tooltip title="Xóa"><Popconfirm title="Xóa?" onConfirm={() => handleDelete(room.room_id)}><DeleteOutlined key="delete" style={{ color: 'red' }} /></Popconfirm></Tooltip>
                      ]}
                    >
                      <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f1f1f' }}>{room.room_number}</div>
                        <div style={{ color: '#8c8c8c', fontSize: '12px' }}>{roomTypeMap[room.room_type_id]}</div>
                        {room.bed_style && (
                          <div style={{ color: '#595959', fontSize: '12px', marginTop: 4, fontStyle: 'italic' }}>
                            <span role="img" aria-label="bed">🛏️</span> {room.bed_style}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <Tag color={statusColor} style={{ marginRight: 0 }}>{statusText}</Tag>
                      </div>

                      {bookingInfo}

                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
          {/* Pagination for Grid if needed, currently sharing pagination state but might need visual pager at bottom if list is long */}
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button disabled={pagination.current === 1} onClick={() => handleTableChange({ ...pagination, current: pagination.current - 1 })}>Trước</Button>
              <span>Trang {pagination.current}</span>
              <Button disabled={filteredRooms.length < pagination.pageSize} onClick={() => handleTableChange({ ...pagination, current: pagination.current + 1 })}>Sau</Button>
            </Space>
          </div>
        </div>
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

      {/* Form Thông tin đặt phòng */}
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
