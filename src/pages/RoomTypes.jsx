// src/pages/RoomTypes.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Input,
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
} from "@ant-design/icons";
import RoomTypeForm from "../components/RoomTypeForm.jsx";

import roomTypeApi from "../api/roomTypeApi.js";

const RoomTypes = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [loading, setLoading] = useState(false);

  // state cho phân trang Table
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 🔹 Gọi backend lấy dữ liệu
  const fetchRoomTypes = async (
    page = pagination.current,
    limit = pagination.pageSize
  ) => {
    try {
      setLoading(true);
      const res = await roomTypeApi.getAll(page, limit);
      // Giả sử backend trả về: { success, data, pagination }
      //    Nếu khác, bạn console.log(res) rồi chỉnh ở đây
      setRoomTypes(res.data || []);
      if (res.pagination) {
        setPagination({
          current: res.pagination.page,
          pageSize: res.pagination.limit,
          total: res.pagination.total,
        });
      } else {
        // fallback: nếu không có pagination từ server
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: limit,
          total: (res.data || []).length,
        }));
      }
    } catch (error) {
      console.error(error);
      message.error("Không tải được danh sách loại phòng");
    } finally {
      setLoading(false);
    }
  };
  // useEffect tự động load lần đầu
  useEffect(() => {
    fetchRoomTypes(1, pagination.pageSize);
  }, []);

  // 🔍 Lọc tìm kiếm loại phòng (lọc trên client)
  const filteredRoomTypes = useMemo(() => {
    return roomTypes.filter((rt) =>
      rt.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [roomTypes, searchText]);
  //Thêm mới
  const openCreateModal = () => {
    setEditingRoomType(null);
    setIsModalOpen(true);
  };
  //Sửa
  const openEditModal = (roomType) => {
    setEditingRoomType(roomType);
    setIsModalOpen(true);
  };
  //Xóa
  const handleDelete = async (id) => {
    try {
      await roomTypeApi.delete(id);
      message.success("Đã xóa loại phòng");
      // tải lại data
      fetchRoomTypes();
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không xóa được loại phòng";
      message.error(msg);
    }
  };
  //Thêm/Sửa
  const handleSubmitForm = async (values) => {
    try {
      if (editingRoomType) {
        // UPDATE
        await roomTypeApi.update(editingRoomType.room_type_id, values);
        message.success("Cập nhật loại phòng thành công");
      } else {
        // CREATE
        await roomTypeApi.create(values);
        message.success("Thêm loại phòng thành công");
      }
      setIsModalOpen(false);
      setEditingRoomType(null);
      fetchRoomTypes(); // reload
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Có lỗi khi lưu loại phòng";
      message.error(msg);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "room_type_id",
      key: "room_type_id",
      width: 80,
    },
    {
      title: "Tên loại phòng",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Sức chứa",
      dataIndex: "capacity",
      key: "capacity",
      align: "center",
    },
    {
      title: "Giá cơ bản / đêm",
      dataIndex: "base_price", // dùng base_price từ backend
      key: "base_price",
      render: (value) =>
        `${Number(value)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} VNĐ`,
      sorter: (a, b) => a.base_price - b.base_price,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa loại phòng"
            description={`Bạn có chắc muốn xóa loại phòng "${record.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.room_type_id)}
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
        </Space >
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
    fetchRoomTypes(current, pageSize);
  };

  return (
    <Card
      title="Quản lý loại phòng"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Thêm loại phòng
        </Button>
      }
    >
      {/* Search */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo tên loại phòng..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
      </Space>

      {/* Table */}
      <Table
        rowKey="room_type_id"
        columns={columns}
        dataSource={filteredRoomTypes}
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
      <RoomTypeForm
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingRoomType(null);
        }}
        onSubmit={handleSubmitForm}
        initialValues={editingRoomType}
        isEditing={!!editingRoomType}
      />
    </Card>
  );
};

export default RoomTypes;
