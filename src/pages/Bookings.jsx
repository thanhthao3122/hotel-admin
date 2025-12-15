
import { useEffect, useMemo, useState } from 'react';

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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";


import bookingApi from '../api/bookingApi.js';
import userApi from '../api/userApi.js';
import roomApi from '../api/roomApi.js';
import roomTypeApi from '../api/roomTypeApi.js';


import BookingForm from "../components/BookingForm.jsx";

const { Option } = Select;

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

  // Fetch all necessary data
  const fetchData = async (
    page = pagination.current,
    limit = pagination.pageSize
  ) => {
    try {
      setLoading(true);
      const [bookingRes, customerRes, roomRes, roomTypeRes] = await Promise.all([
        bookingApi.getAll(page, limit),
        userApi.getAll(1, 100), // Fetch first 100 customers for dropdown
        roomApi.getAll(1, 100), // Fetch first 100 rooms for dropdown
        roomTypeApi.getAll(1, 100) // Fetch first 100 room types
      ]);

      setBookings(bookingRes.data || []);
      if (bookingRes.pagination) {
        setPagination({
          current: bookingRes.pagination.page,
          pageSize: bookingRes.pagination.limit,
          total: bookingRes.pagination.total,
        });
      }

      setCustomers(customerRes.data || []);
      setRooms(roomRes.data || []);
      setRoomTypes(roomTypeRes.data || []);

    } catch (error) {
      console.error(error);
      message.error('Không tải được dữ liệu đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // map ID → object

  const customerMap = useMemo(() => Object.fromEntries(customers.map(c => [c.user_id, c])), [customers]);
  const roomMap = useMemo(() => Object.fromEntries(rooms.map(r => [r.room_id, r])), [rooms]);
  const roomTypeMap = useMemo(() => Object.fromEntries(roomTypes.map(rt => [rt.room_type_id, rt])), [roomTypes]);


  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const keyword = searchText.toLowerCase();
      const customer = customerMap[b.user_id]; // Note: booking uses user_id not customer_id

      const matchSearch = customer
        ? (customer.full_name?.toLowerCase().includes(keyword) || customer.phone?.includes(keyword))
        : false;

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
        // Update
        await bookingApi.update(editingBooking.booking_id, data);
        message.success("Cập nhật đặt phòng thành công");
      } else {
        // Create
        await bookingApi.create(data);
        message.success("Tạo đặt phòng thành công");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Có lỗi khi lưu đặt phòng");

    }
  };

  const handleDelete = async (id) => {
    try {
      await bookingApi.delete(id);
      message.success('Đã xóa đặt phòng');
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Không xóa được đặt phòng');
    }
  };

  const updateStatus = async (record, newStatus) => {
    try {
      await bookingApi.updateStatus(record.booking_id, newStatus);
      message.success("Cập nhật trạng thái thành công");
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Không cập nhật được trạng thái');
    }

  };

  const columns = [
    {
      title: "Khách hàng",
      render: (_, record) => {
        const c = customerMap[record.user_id];
        return c ? `${c.full_name} (${c.phone})` : 'N/A';
      },
    },
    {

      title: 'Số Phòng',
      render: (_, record) => {
        if (!record.rooms || record.rooms.length === 0) return 'N/A';
        return record.rooms.map(room => room.room_number).join(', ');
      },
    },
    {
      title: 'Check-in',
      dataIndex: 'checkin_date',
      render: (date) => date || 'N/A'
    },
    {
      title: 'Check-out',
      dataIndex: 'checkout_date',
      render: (date) => date || 'N/A'
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_price',
      render: v => v ? Number(v).toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (st, record) => {
        const color = {
          pending: 'blue',
          confirmed: 'cyan',
          checked_in: 'green',
          checked_out: 'orange',
          cancelled: 'red',
        }[st.toLowerCase()] || 'default';

        return (
          <Select
            defaultValue={st.toLowerCase()}
            style={{ width: 140 }}
            onChange={(val) => updateStatus(record, val)}
            status={st.toLowerCase() === 'cancelled' ? 'error' : ''}
          >
            <Option value="pending">Đang chờ</Option>
            <Option value="confirmed">Đã xác nhận</Option>
            <Option value="checked_in">Đã nhận phòng</Option>
            <Option value="checked_out">Đã trả phòng</Option>
            <Option value="cancelled">Đã hủy</Option>
          </Select>
        );

      },
    },
    {
      title: "Hành động",
      render: (_, r) => (
        <Space>

          <Button size="small" icon={<EditOutlined />}
            onClick={() => { setEditingBooking(r); setIsModalOpen(true); }}>
            Sửa
          </Button>

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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
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
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />

        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 180 }}
          value={filterStatus || undefined}
          onChange={(v) => setFilterStatus(v)}
        >
          <Option value="pending">Đang chờ</Option>
          <Option value="confirmed">Đã xác nhận</Option>
          <Option value="checked_in">Đã nhận phòng</Option>
          <Option value="checked_out">Đã trả phòng</Option>
          <Option value="cancelled">Đã hủy</Option>
        </Select>
      </Space>

      <Table
        rowKey="booking_id"
        columns={columns}
        dataSource={filteredBookings}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20'],
        }}
        onChange={(pager) => {
          const { current, pageSize } = pager;
          setPagination(prev => ({ ...prev, current, pageSize }));
          fetchData(current, pageSize);
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
