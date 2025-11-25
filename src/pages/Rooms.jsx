// src/pages/Rooms.jsx
import { useEffect, useMemo, useState } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import RoomForm from '../components/RoomForm.jsx';
import roomApi from '../api/roomApi.js';
import roomTypeApi from '../api/roomTypeApi.js';

const { Option } = Select;

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  // map room_type_id -> name
  const roomTypeMap = useMemo(() => {
    const map = {};
    roomTypes.forEach((rt) => {
      map[rt.room_type_id] = rt.name;
    });
    return map;
  }, [roomTypes]);

  const fetchRoomTypes = async () => {
    try {
      const res = await roomTypeApi.getActive();
      setRoomTypes(res.data || []);
    } catch (error) {
      console.error(error);
      message.error('Không tải được danh sách loại phòng');
    }
  };

  const fetchRooms = async (page = pagination.current, limit = pagination.pageSize) => {
    try {
      setLoading(true);
      const res = await roomApi.getAll(page, limit);
      setRooms(res.data || []);
      if (res.pagination) {
        setPagination({
          current: res.pagination.page,
          pageSize: res.pagination.limit,
          total: res.pagination.total,
        });
      } else {
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: limit,
          total: (res.data || []).length,
        }));
      }
    } catch (error) {
      console.error(error);
      message.error('Không tải được danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
    fetchRooms(1, pagination.pageSize);
  }, []);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const keyword = searchText.toLowerCase();
      const matchSearch = room.room_number.toLowerCase().includes(keyword);

      const matchStatus = filterStatus ? room.status === filterStatus : true;
      const matchType = filterRoomType ? room.room_type_id === filterRoomType : true;

      return matchSearch && matchStatus && matchType;
    });
  }, [rooms, searchText, filterStatus, filterRoomType]);

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
      message.success('Đã xóa phòng');
      fetchRooms();
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Không xóa được phòng';
      message.error(msg);
    }
  };

  const handleSubmitForm = async (values) => {
    try {
      if (editingRoom) {
        await roomApi.update(editingRoom.room_id, values);
        message.success('Cập nhật phòng thành công');
      } else {
        await roomApi.create(values);
        message.success('Thêm phòng thành công');
      }

      setIsModalOpen(false);
      setEditingRoom(null);
      fetchRooms();
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Có lỗi khi lưu phòng';
      message.error(msg);
    }
  };

  const resetFilter = () => {
    setSearchText('');
    setFilterStatus('');
    setFilterRoomType('');
  };

  const renderStatusTag = (status) => {
    let color = 'default';
    let text = status;

    switch (status) {
      case 'available':
        color = 'green';
        text = 'Trống';
        break;
      case 'booked':
        color = 'orange';
        text = 'Đã đặt';
        break;
      case 'occupied':
        color = 'red';
        text = 'Đang ở';
        break;
      case 'cleaning':
        color = 'blue';
        text = 'Đang dọn';
        break;
      case 'maintenance':
        color = 'purple';
        text = 'Bảo trì';
        break;
      default:
        break;
    }

    return <Tag color={color}>{text}</Tag>;
  };

  const columns = [
    {
      title: 'Số phòng',
      dataIndex: 'room_number',
      key: 'room_number',
      sorter: (a, b) => a.room_number.localeCompare(b.room_number),
    },
    {
      title: 'Loại phòng',
      dataIndex: 'room_type_id',
      key: 'room_type_id',
      render: (room_type_id) => roomTypeMap[room_type_id] || 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => renderStatusTag(status),
      filters: [
        { text: 'Trống', value: 'available' },
        { text: 'Đã đặt', value: 'booked' },
        { text: 'Đang ở', value: 'occupied' },
        { text: 'Đang dọn', value: 'cleaning' },
        { text: 'Bảo trì', value: 'maintenance' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Hành động',
      key: 'actions',
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

  const handleTableChange = (pager) => {
    const { current, pageSize } = pager;
    setPagination((prev) => ({
      ...prev,
      current,
      pageSize,
    }));
    fetchRooms(current, pageSize);
  };

  return (
    <Card
      title="Quản lý phòng"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
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

        <Select
          placeholder="Lọc theo trạng thái"
          value={filterStatus || undefined}
          onChange={(value) => setFilterStatus(value)}
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

      {/* Table */}
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
          pageSizeOptions: ['5', '10', '20'],
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
