// src/pages/RoomTypes.jsx
import { useState, useMemo } from 'react';
import {
  Button,
  Card,
  Input,
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
} from '@ant-design/icons';
import RoomTypeForm from '../components/RoomTypeForm.jsx';
import { MOCK_ROOM_TYPES } from '../mock/roomTypes.js';

const RoomTypes = () => {
  const [roomTypes, setRoomTypes] = useState(MOCK_ROOM_TYPES);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);

  // Lọc theo tên loại phòng
  const filteredRoomTypes = useMemo(() => {
    return roomTypes.filter(rt =>
      rt.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [roomTypes, searchText]);

  const openCreateModal = () => {
    setEditingRoomType(null);
    setIsModalOpen(true);
  };

  const openEditModal = (roomType) => {
    setEditingRoomType(roomType);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setRoomTypes(prev => prev.filter(rt => rt.room_type_id !== id));
    message.success('Đã xóa loại phòng');
  };

  const handleSubmitForm = (values) => {
    if (editingRoomType) {
      // update
      setRoomTypes(prev =>
        prev.map(rt =>
          rt.room_type_id === editingRoomType.room_type_id
            ? { ...rt, ...values }
            : rt
        )
      );
      message.success('Cập nhật loại phòng thành công');
    } else {
      // create
      const newRoomType = {
        room_type_id: Date.now(), // fake id
        ...values,
      };
      setRoomTypes(prev => [...prev, newRoomType]);
      message.success('Thêm loại phòng thành công');
    }
    setIsModalOpen(false);
    setEditingRoomType(null);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'room_type_id',
      key: 'room_type_id',
      width: 80,
    },
    {
      title: 'Tên loại phòng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Sức chứa',
      dataIndex: 'capacity',
      key: 'capacity',
      align: 'center',
    },
    {
      title: 'Giá cơ bản / đêm',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (value) =>
        `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} VNĐ`,
      sorter: (a, b) => a.base_price - b.base_price,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center',
      render: (value) =>
        value === 1 ? (
          <Tag color="green">Hiện</Tag>
        ) : (
          <Tag color="red">Ẩn</Tag>
        ),
      filters: [
        { text: 'Hiện', value: 1 },
        { text: 'Ẩn', value: 0 },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center',
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
              danger
              icon={<DeleteOutlined />}
              size="small"
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
      title="Quản lý loại phòng"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
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
          onChange={e => setSearchText(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
      </Space>

      {/* Table */}
      <Table
        rowKey="room_type_id"
        columns={columns}
        dataSource={filteredRoomTypes}
        pagination={{ pageSize: 5 }}
      />

      {/* Modal Thêm/Sửa */}
      <RoomTypeForm
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingRoomType(null);
        }}
        onSubmit={handleSubmitForm}
        initialValues={
          editingRoomType
            ? {
                ...editingRoomType,
                is_active: editingRoomType.is_active === 1,
              }
            : null
        }
        isEditing={!!editingRoomType}
      />
    </Card>
  );
};

export default RoomTypes;
