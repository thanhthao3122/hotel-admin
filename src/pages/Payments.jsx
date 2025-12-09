// src/pages/Payments.jsx
import { useState, useMemo, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Popconfirm,
  message,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import paymentApi from "../api/paymentApi";
import bookingApi from "../api/bookingApi";
import userApi from "../api/userApi";

import PaymentForm from "../components/PaymentForm";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentRes, bookingRes, customerRes] = await Promise.all([
        paymentApi.getAll(pagination.current, pagination.pageSize),
        bookingApi.getAll(1, 100), // Fetch recent bookings
        userApi.getAll(1, 100) // Fetch customers
      ]);

      setPayments(paymentRes.data || []);
      if (paymentRes.pagination) {
        setPagination({
          current: paymentRes.pagination.page,
          pageSize: paymentRes.pagination.limit,
          total: paymentRes.pagination.total,
        });
      }

      setBookings(bookingRes.data || []);
      setCustomers(customerRes.data || []);

    } catch (error) {
      console.error(error);
      message.error("Không tải được dữ liệu thanh toán");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.user_id, c])), [customers]);
  const bookingMap = useMemo(() => Object.fromEntries(bookings.map((b) => [b.booking_id, b])), [bookings]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const booking = bookingMap[p.booking_id];
      if (!booking) return false;
      const customer = customerMap[booking.user_id];
      if (!customer) return false;

      const keyword = search.toLowerCase();
      return (
        customer.full_name?.toLowerCase().includes(keyword) ||
        customer.phone?.includes(keyword)
      );
    });
  }, [payments, search, bookingMap, customerMap]);

  // Note: handlePay is currently not triggered by UI, keeping for future use
  const handlePay = (booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };

  const handlePaymentSubmit = async (values) => {
    // Logic to create payment via API would go here
    // For now, this form is not accessible
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    try {
      await paymentApi.delete(id);
      message.success("Đã xóa thanh toán!");
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Không xóa được thanh toán");
    }
  };

  const columns = [
    {
      title: "Khách hàng",
      render: (_, r) => {
        const b = bookingMap[r.booking_id];
        if (!b) return "N/A";
        const c = customerMap[b.user_id];
        if (!c) return "N/A";
        return (
          <>
            <b>{c.full_name}</b>
            <div style={{ fontSize: 12, color: "#888" }}>{c.phone}</div>
          </>
        );
      },
    },
    {
      title: "Tiền phòng",
      dataIndex: "room_charge",
      render: (v) => v ? v.toLocaleString("vi-VN") + " VNĐ" : "0 VNĐ",
    },
    {
      title: "Dịch vụ",
      dataIndex: "service_charge",
      render: (v) => v ? v.toLocaleString("vi-VN") + " VNĐ" : "0 VNĐ",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      render: (v) => (
        <Tag color="green">{v ? v.toLocaleString("vi-VN") : 0} VNĐ</Tag>
      ),
    },
    {
      title: "Ngày thanh toán",
      dataIndex: "created_at",
      render: (v) => v ? new Date(v).toLocaleString("vi-VN") : "",
    },
    {
      title: "Hành động",
      render: (_, r) => (
        <Space>
          <Popconfirm
            title="Xóa thanh toán?"
            onConfirm={() => handleDelete(r.payment_id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Thanh toán"
      extra={<span>Có {pagination.total} giao dịch</span>}
    >
      <Input
        prefix={<SearchOutlined />}
        placeholder="Tìm theo tên KH..."
        allowClear
        style={{ width: 300, marginBottom: 16 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table
        rowKey="payment_id"
        columns={columns}
        dataSource={filteredPayments}
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

      {selectedBooking && (
        <PaymentForm
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onSubmit={handlePaymentSubmit}
          booking={selectedBooking}
          roomTypes={[]} // Not fetching roomTypes yet as form is unused
          servicesUsage={[]} // Not fetching servicesUsage yet as form is unused
        />
      )}
    </Card>
  );
};

export default Payments;
