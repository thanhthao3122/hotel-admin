// src/pages/ServiceUsage.jsx
import { useMemo, useState } from "react";
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

import { MOCK_SERVICES_USAGE } from "../mock/servicesUsage.js";
import { MOCK_BOOKINGS } from "../mock/bookings.js";
import { MOCK_CUSTOMERS } from "../mock/customers.js";
import { MOCK_ROOMS } from "../mock/rooms.js";
import { MOCK_SERVICES } from "../mock/services.js";

import ServiceUsageForm from "../components/ServiceUsageForm.jsx";

const { Option } = Select;

const ServiceUsage = () => {
  const [usages, setUsages] = useState(MOCK_SERVICES_USAGE);
  const [bookings] = useState(MOCK_BOOKINGS);
  const [customers] = useState(MOCK_CUSTOMERS);
  const [rooms] = useState(MOCK_ROOMS);
  const [services] = useState(MOCK_SERVICES);

  const [searchText, setSearchText] = useState("");
  const [filterService, setFilterService] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsage, setEditingUsage] = useState(null);

  // state phân trang để tính STT
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: usages.length,
  });

  const bookingMap = Object.fromEntries(bookings.map((b) => [b.booking_id, b]));
  const customerMap = Object.fromEntries(
    customers.map((c) => [c.customer_id, c])
  );
  const roomMap = Object.fromEntries(rooms.map((r) => [r.room_id, r]));
  const serviceMap = Object.fromEntries(services.map((s) => [s.service_id, s]));

  const filteredUsages = useMemo(() => {
    const keyword = searchText.toLowerCase();

    const list = usages.filter((u) => {
      const booking = bookingMap[u.booking_id];
      const customer = customerMap[booking.customer_id];
      const room = roomMap[u.room_id];

      const matchSearch =
        customer.full_name.toLowerCase().includes(keyword) ||
        customer.phone.includes(keyword) ||
        room.room_number.toLowerCase().includes(keyword);

      const matchService = filterService
        ? u.service_id === filterService
        : true;

      return matchSearch && matchService;
    });

    // cập nhật total cho pagination theo list sau khi filter
    setPagination((prev) => ({
      ...prev,
      total: list.length,
    }));

    return list;
  }, [usages, searchText, filterService]);

  const openCreateModal = () => {
    setEditingUsage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (values) => {
    if (editingUsage) {
      // update mock
      setUsages((prev) =>
        prev.map((u) =>
          u.usage_id === editingUsage.usage_id ? { ...u, ...values } : u
        )
      );
      message.success("Cập nhật sử dụng dịch vụ thành công");
    } else {
      // create mock
      const newUsage = {
        usage_id: Date.now(), // id thật vẫn giữ, nhưng không dùng để hiển thị
        ...values,
      };
      setUsages((prev) => [...prev, newUsage]);
      message.success("Thêm sử dụng dịch vụ thành công");
    }

    setIsModalOpen(false);
    setEditingUsage(null);
  };

  const handleDelete = (usage_id) => {
    setUsages((prev) => prev.filter((u) => u.usage_id !== usage_id));
    message.success("Đã xóa sử dụng dịch vụ");
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
      title: "ID", // STT
      key: "index",
      width: 80,
      align: "center",
      render: (text, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Khách hàng",
      render: (_, record) => {
        const booking = bookingMap[record.booking_id];
        const customer = customerMap[booking.customer_id];
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
        const room = roomMap[record.room_id];
        return `Phòng ${room.room_number} (Tầng ${room.floor})`;
      },
    },
    {
      title: "Dịch vụ",
      render: (_, record) => {
        const service = serviceMap[record.service_id];
        return (
          <>
            <div>{service.name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {service.price.toLocaleString("vi-VN")} VNĐ / {service.unit}
            </div>
          </>
        );
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
      render: (v) => <Tag color="red">{v.toLocaleString("vi-VN")} VNĐ</Tag>,
    },
    {
      title: "Gọi lúc",
      dataIndex: "created_at",
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUsage(record);
              setIsModalOpen(true);
            }}
          >
            Sửa
          </Button>
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
        rowKey="usage_id" // giữ usage_id làm key nội bộ
        columns={columns}
        dataSource={filteredUsages} // dùng list đã filter
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20"],
        }}
        onChange={handleTableChange}
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
        bookings={bookings}
        rooms={rooms}
        services={services}
        customers={customers}
      />
    </Card>
  );
};

export default ServiceUsage;
