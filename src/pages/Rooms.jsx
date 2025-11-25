// src/pages/Rooms.jsx
import { useMemo, useState } from 'react';
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
import { MOCK_ROOMS } from '../mock/rooms.js';
import { MOCK_ROOM_TYPES } from '../mock/roomTypes.js';

const { Option } = Select;

const Rooms = () => {
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [roomTypes] = useState(MOCK_ROOM_TYPES);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Map room_type_id -> name
  const roomTypeMap = useMemo(() => {
    const map = {};
    roomTypes.forEach(rt => {
      map[rt.room_type_id] = rt.name;
    });
    return map;
  }, [roomTypes]);

  // Lọc danh sách rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchSearch = room.room_number
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchStatus = filterStatus ? room.status === filterStatus : true;
      const matchType = filterRoomType
        ? room.room_type_id === filterRoomType
        : true;

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

  const handleDelete = (id) => {
    setRooms(prev => prev.filter(r => r.room_id !== id));
    message.success('Đã xóa phòng');
  };

  const handleSubmitForm = (values) => {
    if (editingRoom) {
      // update
      setRooms(prev =>
        prev.map(r =>
          r.room_id === editingRoom.room_id
            ? { ...r, ...values }
            : r
        )
      );
      message.success('Cập nhật phòng thành công');
    } else {
      // create
      const newRoom = {
        room_id: Date.now(), // fake id
        ...values,
      };
      setRooms(prev => [...prev, newRoom]);
      message.success('Thêm phòng thành công');
    }
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const resetFilter = () => {
    setSearchText('');
    setFilterStatus('');
    setFilterRoomType('');
  };

  const renderStatusTag = (status) => {
    let color = 'default';
    let text = '';

    switch (status) {
      case 'AVAILABLE':
        color = 'green';
        text = 'Trống';
        break;
      case 'BOOKED':
        color = 'orange';
        text = 'Đã đặt';
        break;
      case 'OCCUPIED':
        color = 'red';
        text = 'Đang ở';
        break;
      case 'CLEANING':
        color = 'blue';
        text = 'Đang dọn';
        break;
      default:
        text = status;
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
      title: 'Tầng',
      dataIndex: 'floor',
      key: 'floor',
      width: 80,
      sorter: (a, b) => a.floor - b.floor,
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
        { text: 'Trống', value: 'AVAILABLE' },
        { text: 'Đã đặt', value: 'BOOKED' },
        { text: 'Đang ở', value: 'OCCUPIED' },
        { text: 'Đang dọn', value: 'CLEANING' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Hành động',
      key: 'actions',
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
            title="Xóa phòng"
            description={`Bạn có chắc muốn xóa phòng ${record.room_number}?`}
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.room_id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
          onChange={e => setSearchText(e.target.value)}
          allowClear
          style={{ width: 200 }}
        />
        <Select
          placeholder="Lọc theo loại phòng"
          value={filterRoomType || undefined}
          onChange={value => setFilterRoomType(value)}
          allowClear
          style={{ width: 200 }}
        >
          {roomTypes.map(rt => (
            <Option key={rt.room_type_id} value={rt.room_type_id}>
              {rt.name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Lọc theo trạng thái"
          value={filterStatus || undefined}
          onChange={value => setFilterStatus(value)}
          allowClear
          style={{ width: 180 }}
        >
          <Option value="AVAILABLE">Trống</Option>
          <Option value="BOOKED">Đã đặt</Option>
          <Option value="OCCUPIED">Đang ở</Option>
          <Option value="CLEANING">Đang dọn</Option>
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
        pagination={{ pageSize: 5 }}
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
