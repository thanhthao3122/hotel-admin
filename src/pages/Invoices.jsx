// src/pages/Invoices.jsx
import { Card, Table, Tag, message } from "antd";
import { useState, useEffect, useMemo } from "react";

import invoiceApi from "../api/invoiceApi";
import bookingApi from "../api/bookingApi";
import userApi from "../api/userApi";
import roomApi from "../api/roomApi";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoiceRes, bookingRes, customerRes, roomRes] = await Promise.all([
        invoiceApi.getAll(pagination.current, pagination.pageSize),
        bookingApi.getAll(1, 100),
        userApi.getAll(1, 100),
        roomApi.getAll(1, 100)
      ]);

      setInvoices(invoiceRes.data || []);
      if (invoiceRes.pagination) {
        setPagination({
          current: invoiceRes.pagination.page,
          pageSize: invoiceRes.pagination.limit,
          total: invoiceRes.pagination.total,
        });
      }

      setBookings(bookingRes.data || []);
      setCustomers(customerRes.data || []);
      setRooms(roomRes.data || []);

    } catch (error) {
      console.error(error);
      message.error("Không tải được danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const customerMap = useMemo(() => Object.fromEntries(customers.map(c => [c.user_id, c])), [customers]);
  const bookingMap = useMemo(() => Object.fromEntries(bookings.map(b => [b.booking_id, b])), [bookings]);
  const roomMap = useMemo(() => Object.fromEntries(rooms.map(r => [r.room_id, r])), [rooms]);

  const columns = [
    { title: "Mã HĐ", dataIndex: "invoice_id", width: 100 },
    { title: "Booking", dataIndex: "booking_id" },
    {
      title: "Khách hàng",
      render: (_, r) => {
        const b = bookingMap[r.booking_id];
        if (!b) return "N/A";
        const c = customerMap[b.user_id];
        return c ? c.full_name : "N/A";
      }
    },
    {
      title: "Số phòng",
      render: (_, r) => {
        const b = bookingMap[r.booking_id];
        if (!b) return "N/A";
        const room = roomMap[b.room_id];
        return room ? room.room_number : "N/A";
      }
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      render: (v) => (
        <Tag color="blue">{v ? v.toLocaleString("vi-VN") : 0} VNĐ</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      render: (v) => v ? new Date(v).toLocaleString("vi-VN") : ""
    },
  ];

  return (
    <Card title="Danh sách hóa đơn">
      <Table
        rowKey="invoice_id"
        columns={columns}
        dataSource={invoices}
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
    </Card>
  );
};

export default Invoices;
