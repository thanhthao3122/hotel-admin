// src/pages/Rooms.jsx
import { useEffect, useMemo, useState } from "react";
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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import RoomForm from "../components/RoomForm.jsx";
import roomApi from "../api/roomApi.js";
import roomTypeApi from "../api/roomTypeApi.js";
import socket from "../utils/socket.js";

const { Option } = Select;

// ✅ URL base để load ảnh từ backend
const IMAGE_BASE_URL = "http://localhost:5000";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRoomType, setFilterRoomType] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
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
    filters = {}
  ) => {
    try {
      setLoading(true);

      const res = await roomApi.getAll(page, limit, filters);

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

  useEffect(() => {
    fetchRoomTypes();
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
      const room = rooms.find(r => r.room_id === data.room_id);
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
      const matchSearch = String(room.room_number || "").toLowerCase().includes(keyword);

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
      sorter: (a, b) => String(a.room_number).localeCompare(String(b.room_number)),
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
      title: "Loại phòng",
      dataIndex: "room_type_id",
      key: "room_type_id",
      render: (room_type_id) => roomTypeMap[room_type_id] || "N/A",
    },


    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => renderStatusTag(status),
      // phần filter này là filter của Table ở FE, bạn có thể giữ hoặc bỏ
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
          ></Popconfirm>
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
      <Space style={{ marginBottom: 16 }} wrap>
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
          onChange={(value) => setFilterRoomType(value)}
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

        <Button icon={<ReloadOutlined />} onClick={resetFilter}>
          Xóa lọc
        </Button>
      </Space>

      {/* Table  : PHÂN TRANG*/}
      <Table
        rowKey="room_id"
        columns={columns}
        dataSource={filteredRooms}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20"],
        }}
        onChange={handleTableChange}
      />

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
    </Card>
  );
};

export default Rooms;
