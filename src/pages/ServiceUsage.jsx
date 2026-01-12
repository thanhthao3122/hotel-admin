// src/pages/ServiceUsage.jsx
import { useMemo, useState, useEffect } from "react";
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Space,
  Table,
  Tag,
  message,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";


import serviceUsageApi from "../api/serviceUsageApi";
import bookingApi from "../api/bookingApi";
import userApi from "../api/userApi";
import roomApi from "../api/roomApi";
import serviceApi from "../api/serviceApi";
import socket from "../utils/socket";


import ServiceUsageForm from "../components/ServiceUsageForm.jsx";

const { Option } = Select;

const ServiceUsage = () => {
  const [usages, setUsages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterService, setFilterService] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsage, setEditingUsage] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usageRes, bookingRes, customerRes, roomRes, serviceRes] = await Promise.all([
        serviceUsageApi.getAll(pagination.current, pagination.pageSize),
        bookingApi.getAll(1, 2000),
        userApi.getAll(1, 2000),
        roomApi.getAll(1, 2000),
        serviceApi.getAll(1, 2000)
      ]);

      setUsages(usageRes.data || []);
      if (usageRes.pagination) {
        setPagination({
          current: usageRes.pagination.page,
          pageSize: usageRes.pagination.limit,
          total: usageRes.pagination.total,
        });
      }

      setBookings(bookingRes.data || []);
      setCustomers(customerRes.data || []);
      setRooms(roomRes.data || []);
      setServices(serviceRes.data || []);

    } catch (error) {
      console.error(error);
      message.error("Không tải được dữ liệu sử dụng dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Cập nhật thời gian thực khi dịch vụ được thêm hoặc hóa đơn được cập nhật
    const handleServiceUpdate = () => {
      fetchData();
    };

    socket.on('service_added', handleServiceUpdate);
    socket.on('invoice_updated', handleServiceUpdate);

    return () => {
      socket.off('service_added', handleServiceUpdate);
      socket.off('invoice_updated', handleServiceUpdate);
    };
  }, []);

  const bookingMap = useMemo(() => Object.fromEntries(bookings.map((b) => [b.booking_id, b])), [bookings]);
  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.user_id, c])), [customers]);
  const roomMap = useMemo(() => Object.fromEntries(rooms.map((r) => [r.room_id, r])), [rooms]);
  const serviceMap = useMemo(() => Object.fromEntries(services.map((s) => [s.service_id, s])), [services]);

  const filteredUsages = useMemo(() => {
    return usages.filter((u) => {
      const booking = u.bookingRoom?.booking || bookingMap[u.bookingRoom?.booking_id];
      if (!booking) return false;

      const customer = customerMap[booking.user_id];
      const service = u.service || serviceMap[u.service_id];

      if (!customer || !service) return false;

      const keyword = searchText.toLowerCase();


      // Lấy số phòng từ booking.bookingRooms
      const roomNumbers = booking.bookingRooms?.map(br => br.room?.room_number).filter(Boolean) || [];
      const roomText = roomNumbers.join(' ');

      const matchSearch =
        customer.full_name?.toLowerCase().includes(keyword) ||
        customer.phone?.includes(keyword) ||
        roomText.toLowerCase().includes(keyword);

      const matchService = filterService
        ? u.service_id === filterService
        : true;

      return matchSearch && matchService;
    });
  }, [usages, searchText, filterService, bookingMap, customerMap, serviceMap]);
  const openCreateModal = () => {
    setEditingUsage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUsage) {
        await serviceUsageApi.update(editingUsage.usage_id, values);
        message.success("Cập nhật sử dụng dịch vụ thành công");
      } else {
        await serviceUsageApi.create(values);
        message.success("Thêm sử dụng dịch vụ thành công");
      }
      setIsModalOpen(false);
      setEditingUsage(null);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Có lỗi khi lưu sử dụng dịch vụ");
    }
  };

  const handleDelete = async (id) => {
    try {
      await serviceUsageApi.delete(id);
      message.success("Đã xóa sử dụng dịch vụ");
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Không xóa được sử dụng dịch vụ");
    }

  };

  const handleTableChange = (pager) => {
    setPagination((prev) => ({
      ...prev,
      current: pager.current,
      pageSize: pager.pageSize,
    }));
  };

  const columns = [
   
    {
      title: "Khách hàng",
      render: (_, record) => {
        const booking = record.bookingRoom?.booking || bookingMap[record.bookingRoom?.booking_id];
        if (!booking) return "N/A";
        const customer = customerMap[booking.user_id];
        if (!customer) return "N/A";
        return (
          <>
            <div>{customer.full_name}</div>
            <div style={{ fontSize: 12, color: "#999" }}>{customer.phone}</div>
          </>
        );
      },
    },
    {
      title: "Phòng",
      render: (_, record) => {
        // If specific room is recorded (new data with booking_room_id)
        if (record.bookingRoom?.room?.room_number) {
          return `Phòng ${record.bookingRoom.room.room_number}`;
        }

        // Fallback: show all rooms (for old data or if no room selected)
        const booking = record.booking || bookingMap[record.booking_id];
        if (!booking || !booking.bookingRooms || booking.bookingRooms.length === 0) return "N/A";

        return booking.bookingRooms.map((br, idx) => {
          return br.room ? `Phòng ${br.room.room_number}` : "N/A";
        }).join(', ');
      },
    },
    {
      title: "Dịch vụ",
      render: (_, record) => {
        const service = record.service || serviceMap[record.service_id];
        return service ? (
          <>
            <div>{service.name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {parseFloat(service.price).toLocaleString("vi-VN")} VNĐ / {service.unit}
            </div>
          </>
        ) : "N/A";
      },
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 100,
      align: "center",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      render: (v) => <Tag color="purple">{v ? parseFloat(v).toLocaleString("vi-VN") : 0} VNĐ</Tag>,
    },
    {
      title: "Gọi lúc",
      dataIndex: "usage_time",
      render: (v) => v ? new Date(v).toLocaleString("vi-VN") : "",
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          
          <Popconfirm
            title="Xóa sử dụng dịch vụ?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.usage_id)}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: "#ff4d4f", // đỏ dịu
                color: "#fff",
                borderColor: "#ff4d4f",
              }}
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
      title="Sử dụng dịch vụ"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 280px)", // ✅ đảm bảo chiếm đủ chiều cao trang
      }}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Thêm sử dụng dịch vụ
        </Button>
      }
    >
      {/* Search + filter */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo tên KH, SĐT hoặc số phòng..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 320 }}
        />
        <Select
          placeholder="Lọc theo dịch vụ"
          allowClear
          style={{ width: 220 }}
          value={filterService || undefined}
          onChange={(v) => setFilterService(v)}
        >
          {services.map((s) => (
            <Option key={s.service_id} value={s.service_id}>
              {s.name}
            </Option>
          ))}
        </Select>
      </Space>

      <Table

        rowKey="usage_id"
        columns={columns}
        dataSource={filteredUsages}
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
          // Note: fetchData uses state pagination, so we might need to pass args or update state first
          // For simplicity, just reload page 1 or implement proper pagination in fetchData
        }}
      />
      <ServiceUsageForm
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingUsage(null);
        }}
        onSubmit={handleSubmit}
        initialValues={editingUsage}
        isEditing={!!editingUsage}
        bookings={bookings.filter(b => ['checked_in', 'confirmed'].includes(b.status))}
        rooms={rooms}
        services={services}
        customers={customers}
      />
    </Card>
  );
};

export default ServiceUsage;
