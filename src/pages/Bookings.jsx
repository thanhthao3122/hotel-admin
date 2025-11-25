import { useMemo, useState } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import { MOCK_BOOKINGS } from '../mock/bookings.js';
import { MOCK_CUSTOMERS } from '../mock/customers.js';
import { MOCK_ROOMS } from '../mock/rooms.js';
import { MOCK_ROOM_TYPES } from '../mock/roomTypes.js';

import BookingForm from '../components/BookingForm.jsx';

const { Option } = Select;

const Bookings = () => {
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [customers] = useState(MOCK_CUSTOMERS);
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [roomTypes] = useState(MOCK_ROOM_TYPES);

  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  // map ID → object
  const customerMap = Object.fromEntries(customers.map(c => [c.customer_id, c]));
  const roomMap = Object.fromEntries(rooms.map(r => [r.room_id, r]));
  const roomTypeMap = Object.fromEntries(roomTypes.map(rt => [rt.room_type_id, rt]));

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const keyword = searchText.toLowerCase();
      const customer = customerMap[b.customer_id];

      const matchSearch =
        customer.full_name.toLowerCase().includes(keyword) ||
        customer.phone.includes(keyword);

      const matchStatus = filterStatus ? b.status === filterStatus : true;

      return matchSearch && matchStatus;
    });
  }, [bookings, searchText, filterStatus]);

  const openCreateModal = () => {
    setEditingBooking(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (data) => {
    if (editingBooking) {
      // Update
      setBookings(prev =>
        prev.map(b =>
          b.booking_id === editingBooking.booking_id
            ? { ...b, ...data }
            : b
        )
      );
      message.success("Cập nhật đặt phòng thành công");
    } else {
      // Create
      const newBooking = {
        booking_id: Date.now(),
        ...data,
        status: 'PENDING',
        created_at: new Date().toISOString().split("T")[0],
      };

      // Mark room as booked
      setRooms(prev =>
        prev.map(r =>
          r.room_id === data.room_id ? { ...r, status: 'BOOKED' } : r
        )
      );

      setBookings(prev => [...prev, newBooking]);
      message.success("Tạo đặt phòng thành công");
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    setBookings(prev => prev.filter(b => b.booking_id !== id));
    message.success('Đã xóa đặt phòng');
  };

  const updateStatus = (record, newStatus) => {
    setBookings(prev =>
      prev.map(b =>
        b.booking_id === record.booking_id
          ? { ...b, status: newStatus }
          : b
      )
    );

    if (newStatus === "CHECKED_IN") message.success("Check-in thành công");
    if (newStatus === "COMPLETED") message.success("Check-out thành công");
    if (newStatus === "CANCELED") message.info("Đã hủy đặt phòng");
  };

  const columns = [
    {
      title: 'Khách hàng',
      render: (_, record) => {
        const c = customerMap[record.customer_id];
        return `${c.full_name} (${c.phone})`;
      },
    },
    {
      title: 'Phòng',
      render: (_, r) => {
        const room = roomMap[r.room_id];
        const roomType = roomTypeMap[room.room_type_id];
        return `Phòng ${room.room_number} - ${roomType.name}`;
      },
    },
    { title: 'Check-in', dataIndex: 'check_in' },
    { title: 'Check-out', dataIndex: 'check_out' },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_price',
      render: v => v.toLocaleString('vi-VN') + ' VNĐ',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (st) => {
        const color = {
          PENDING: 'blue',
          CHECKED_IN: 'green',
          COMPLETED: 'orange',
          CANCELED: 'red',
        }[st];
        return <Tag color={color}>{st}</Tag>;
      },
    },
    {
      title: 'Hành động',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} 
            onClick={() => { setEditingBooking(r); setIsModalOpen(true); }}>
            Sửa
          </Button>

          {r.status === "PENDING" && (
            <Button size="small" onClick={() => updateStatus(r, "CHECKED_IN")}>Check-in</Button>
          )}
          {r.status === "CHECKED_IN" && (
            <Button size="small" onClick={() => updateStatus(r, "COMPLETED")}>Check-out</Button>
          )}
          {r.status !== "COMPLETED" && (
            <Button size="small" danger onClick={() => updateStatus(r, "CANCELED")}>Hủy</Button>
          )}

          <Popconfirm
            title="Xóa đặt phòng?"
            onConfirm={() => handleDelete(r.booking_id)}
            okText="Xóa"
            cancelText="Hủy"
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
      title="Quản lý đặt phòng"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Tạo đặt phòng
        </Button>
      }
    >
      {/* Tìm kiếm & lọc */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo tên KH hoặc SĐT..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />

        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 180 }}
          value={filterStatus || undefined}
          onChange={v => setFilterStatus(v)}
        >
          <Option value="PENDING">Đang chờ</Option>
          <Option value="CHECKED_IN">Đã nhận phòng</Option>
          <Option value="COMPLETED">Đã trả phòng</Option>
          <Option value="CANCELED">Đã hủy</Option>
        </Select>
      </Space>

      <Table
        rowKey="booking_id"
        columns={columns}
        dataSource={filteredBookings}
        pagination={{ pageSize: 5 }}
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
