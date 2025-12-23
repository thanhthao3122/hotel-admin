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
  PlusOutlined,
} from "@ant-design/icons";

import paymentApi from "../api/paymentApi";
import bookingApi from "../api/bookingApi";
import userApi from "../api/userApi";
import socket from "../utils/socket";

import PaymentForm from "../components/PaymentForm";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]); // All bookings for reference
  const [pendingBookings, setPendingBookings] = useState([]); // Pending bookings for creating payment
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });


  const fetchData = async (
    page = pagination.current,
    limit = pagination.pageSize
  ) => {
    try {
      setLoading(true);
      const [paymentRes, bookingRes, customerRes] = await Promise.all([
        paymentApi.getAll(page, limit),
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

      const allBookings = bookingRes.data || [];
      setBookings(allBookings);

      // Filter logic: Find bookings that are NOT paid yet.
      // A booking is paid if it has a 'confirmed' status AND has a completed payment? 
      // Actually, simple logic: Booking status 'pending' or 'confirmed' but NOT 'cancelled'.
      // And check if it already has a completed payment linked?
      // For simplicity, let's just show 'pending' and 'confirmed' bookings here as eligible for payment.
      setPendingBookings(allBookings.filter(b => {
        // Filter by status first
        const isValidStatus = ['pending', 'confirmed', 'checked_in', 'checked_out'].includes(b.status);
        if (!isValidStatus) return false;

        // Filter out if ALREADY PAID
        // Since we now include payments in booking fetch:
        if (b.payments && b.payments.some(p => p.status === 'completed')) {
          return false;
        }
        return true;
      }));

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

    // Real-time updates when payment is received
    const handlePaymentUpdate = () => {
      fetchData();
    };

    socket.on('payment_received', handlePaymentUpdate);

    return () => {
      socket.off('payment_received', handlePaymentUpdate);
    };
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

  const handleCreatePayment = () => {
    setModalOpen(true);
  };

  const handlePaymentSubmit = async (values) => {
    try {
      // paymentApi.create expects { booking_id, amount, payment_method, ... }
      // But the backend create function recalculates amount automatically?
      // Let's check paymentController.js logic. 
      // It calls 'calculateBookingDetails' then creates payment.
      // So we just need booking_id.

      await paymentApi.create({
        booking_id: values.booking_id,
        payment_method: 'cash', // Admin Manual Payment defaults to Cash
        notes: values.notes // Ensure backend supports 'note' or 'notes'
      });

      message.success("Tạo thanh toán thành công!");
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tạo thanh toán: " + (error.response?.data?.message || error.message));
    }
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
      title: "Mã hóa đơn",
      dataIndex: "payment_id",
      width: 100,
      render: (id) => <b>#{id}</b>
    },
    {
      title: "Booking",
      dataIndex: "booking_id",
      width: 100,
      render: (id) => <Tag color="blue">#{id}</Tag>
    },
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
      title: "Tổng tiền",
      dataIndex: "amount",
      render: (_, record) => {
        return (
          <span style={{ fontWeight: 'bold', color: '#108ee9', fontSize: '15px' }} >
            {record.amount ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(record.amount) : 0} VNĐ
          </span >
        );
      },
    },
    {
      title: "Phương thức",
      dataIndex: "payment_method",
      render: (pm) => {
        const map = { cash: 'Tiền mặt', vnpay: 'VNPay', momo: 'Momo', banking: 'Chuyển khoản' };
        return <Tag>{map[pm?.toLowerCase()] || pm}</Tag>
      }
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => {
        const isCompleted = status === 'completed';
        const isFailed = status === 'failed';

        let color = isCompleted ? 'success' : isFailed ? 'error' : 'warning';
        let text = isCompleted ? 'Thành công' : isFailed ? 'Thất bại' : 'Chờ xử lý';
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      }
    },
    {
      title: "Ngày thanh toán",
      dataIndex: "payment_date",
      render: (v) => v ? new Date(v).toLocaleString("vi-VN") : "Chưa thanh toán",
    },
    {
      title: "Hành động",
      render: (_, r) => (
        <Popconfirm
          title="Xóa lịch sử thanh toán?"
          onConfirm={() => handleDelete(r.payment_id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <Card
      title="Quản lý Thanh Toán"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePayment}>
          Tạo thanh toán
        </Button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm theo tên KH..."
          allowClear
          style={{ width: 300 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
          fetchData(current, pageSize);
        }}

      />

      <PaymentForm
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        bookings={pendingBookings}
      />
    </Card>
  );
};

export default Payments;
