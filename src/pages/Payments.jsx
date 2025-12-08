// src/pages/Payments.jsx
import { useState, useMemo } from "react";
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
  DollarOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import { MOCK_BOOKINGS } from "../mock/bookings";
import { MOCK_SERVICES_USAGE } from "../mock/servicesUsage";
import { MOCK_ROOM_TYPES } from "../mock/roomTypes";
import { MOCK_CUSTOMERS } from "../mock/customers";
import { MOCK_PAYMENTS } from "../mock/payments";
import { MOCK_INVOICES } from "../mock/invoices";

import PaymentForm from "../components/PaymentForm";

const Payments = () => {
  const [bookings] = useState(MOCK_BOOKINGS);
  const [roomTypes] = useState(MOCK_ROOM_TYPES);
  const [customers] = useState(MOCK_CUSTOMERS);
  const [servicesUsage] = useState(MOCK_SERVICES_USAGE);

  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [invoices, setInvoices] = useState(MOCK_INVOICES);

  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const customerMap = Object.fromEntries(
    customers.map((c) => [c.customer_id, c])
  );

  const bookingMap = Object.fromEntries(bookings.map((b) => [b.booking_id, b]));

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const booking = bookingMap[p.booking_id];
      const customer = customerMap[booking.customer_id];

      const keyword = search.toLowerCase();
      return (
        customer.full_name.toLowerCase().includes(keyword) ||
        customer.phone.includes(keyword)
      );
    });
  }, [payments, search]);

  const handlePay = (booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };

  const handlePaymentSubmit = (values) => {
    const payment_id = Date.now();

    const newPayment = {
      payment_id,
      booking_id: selectedBooking.booking_id,
      ...values,
      status: "PAID",
      created_at: new Date().toLocaleString("sv-SE").replace("T", " "),
    };

    setPayments((prev) => [...prev, newPayment]);

    // Tạo invoice
    const customer = customerMap[selectedBooking.customer_id];
    const room = selectedBooking.room_id;

    const invoice = {
      invoice_id: Date.now(),
      payment_id,
      booking_id: selectedBooking.booking_id,
      customer_name: customer.full_name,
      room_number: room,
      total_amount: values.total_amount,
      created_at: newPayment.created_at,
    };

    setInvoices((prev) => [...prev, invoice]);

    message.success("Thanh toán thành công!");
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setPayments((prev) => prev.filter((p) => p.payment_id !== id));
    setInvoices((prev) => prev.filter((i) => i.payment_id !== id));
    message.success("Đã xóa thanh toán và hóa đơn!");
  };

  const columns = [
    {
      title: "Khách hàng",
      render: (_, r) => {
        const b = bookingMap[r.booking_id];
        const c = customerMap[b.customer_id];
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
      render: (v) => v.toLocaleString("vi-VN") + " VNĐ",
    },
    {
      title: "Dịch vụ",
      dataIndex: "service_charge",
      render: (v) => v.toLocaleString("vi-VN") + " VNĐ",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      render: (v) => <Tag color="red">{v.toLocaleString("vi-VN")} VNĐ</Tag>,
    },
    {
      title: "Ngày thanh toán",
      dataIndex: "created_at",
    },
    {
      title: "Hành động",
      render: (_, r) => (
        <Space>
          <Popconfirm
            title="Xóa thanh toán?"
            onConfirm={() => handleDelete(r.payment_id)}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: "#ff4d4f", // ✅ đỏ dịu
                borderColor: "#ff4d4f",
                color: "#fff",
              }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Thanh toán"
      extra={<span>Có {payments.length} giao dịch</span>}
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
        pagination={{ pageSize: 10 }}
      />

      {selectedBooking && (
        <PaymentForm
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onSubmit={handlePaymentSubmit}
          booking={selectedBooking}
          roomTypes={roomTypes}
          servicesUsage={servicesUsage}
        />
      )}
    </Card>
  );
};

export default Payments;
