// src/pages/Invoices.jsx
import { Card, Table, Tag, message, Button, Tooltip, Popconfirm, Input, Select } from "antd";
import { CheckOutlined, CloseOutlined, PrinterOutlined, SearchOutlined } from "@ant-design/icons";
import { useState, useEffect, useMemo } from "react";

import invoiceApi from "../api/invoiceApi";
import bookingApi from "../api/bookingApi";
import serviceApi from "../api/serviceApi";
import userApi from "../api/userApi";
import roomApi from "../api/roomApi";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);

  const { Option } = Select;

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
      const [invoiceRes, bookingRes, customerRes, roomRes] = await Promise.all([
        invoiceApi.getAll(page, limit),
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

  const handleUpdateStatus = async (id, status) => {
    try {
      setLoading(true);
      await invoiceApi.updateStatus(id, status);
      message.success(`Đã cập nhật trạng thái thành công`);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (invoice) => {
    const booking = bookingMap[invoice.booking_id] || invoice.booking;
    const customer = booking?.user;

    // Get room names from bookingRooms
    const roomName = booking?.bookingRooms?.map(br => br.room?.room_number).join(', ') || 'N/A';
    const phoneNumber = customer?.phone || 'N/A';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn #${invoice.invoice_id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .invoice-info { margin-bottom: 20px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .invoice-total { text-align: right; font-weight: bold; font-size: 1.2em; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <h1>HÓA ĐƠN THANH TOÁN</h1>
            <p>Mã hóa đơn: #${invoice.invoice_id}</p>
            <p>Ngày: ${new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          
          <div class="invoice-info">
            <p><strong>Khách hàng:</strong> ${customer ? customer.full_name : 'N/A'}</p>
            <p><strong>Email:</strong> ${customer ? customer.email : 'N/A'}</p>
            <p><strong>Số điện thoại:</strong> ${phoneNumber}</p>
            <p><strong>Phòng:</strong> ${roomName}</p>
            <p><strong>Ngày nhận phòng:</strong> ${booking ? new Date(booking.checkin_date).toLocaleDateString('vi-VN') : 'N/A'}</p>
            <p><strong>Ngày trả phòng:</strong> ${booking ? new Date(booking.checkout_date).toLocaleDateString('vi-VN') : 'N/A'}</p>
          </div>

          <table class="invoice-table">
            <thead>
              <tr>
                
                <th>THÀNH TIỀN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tiền phòng</td>
                <td>${invoice.room_charge?.toLocaleString('vi-VN')} VNĐ</td>
              </tr>
              ${booking?.serviceUsages?.map(usage => `
                <tr>
                  <td>${usage.service?.name || 'Dịch vụ'} ( SL: ${usage.quantity})</td>
                  <td>${Number(usage.total_price).toLocaleString('vi-VN')} VNĐ</td>
                </tr>
              `).join('') || ''}
              ${(!booking?.serviceUsages || booking.serviceUsages.length === 0) ? `
              <tr>
                <td>Dịch vụ</td>
                <td>0 VNĐ</td>
              </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="invoice-total">
            <p>Tổng cộng: ${invoice.total_amount ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(invoice.total_amount) : 0} VNĐ</p>
          </div>

          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">In hóa đơn</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const customerMap = useMemo(() => Object.fromEntries(customers.map(c => [c.user_id, c])), [customers]);
  const bookingMap = useMemo(() => Object.fromEntries(bookings.map(b => [b.booking_id, b])), [bookings]);
  const roomMap = useMemo(() => Object.fromEntries(rooms.map(r => [r.room_id, r])), [rooms]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const booking = bookingMap[inv.booking_id];
      const customer = booking ? customerMap[booking.user_id] : null;
      const payment = inv.payment;// payment is nested in invoice from API usually? No, invoiceRes.data has payment object? 
      // Logic check: api/invoiceApi probably returns list.
      // Let's assume invoice object structure has 'payment' or we map it.
      // The column render used r.payment. So it exists.

      const matchSearch = !search || (customer && (
        customer.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone?.includes(search)
      ));

      const matchStatus = !filterStatus || (inv.payment?.status === filterStatus);

      return matchSearch && matchStatus;
    });
  }, [invoices, search, filterStatus, bookingMap, customerMap]);

  const columns = [
    { title: "Mã HĐ", dataIndex: "invoice_id", width: 100 },
    { title: "Booking", dataIndex: "booking_id" },
    {
      title: "Khách hàng",
      render: (_, r) => {
        return r.booking?.user?.full_name || "N/A";
      }
    },
    {
      title: "Số phòng",
      render: (_, r) => {
        return r.booking?.bookingRooms?.map(br => br.room?.room_number).join(', ') || "N/A";
      }
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      render: (_, r) => {
        const amount = r.total_amount || r.amount || 0;
        return (
          <Tag color="blue">
            {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount)} VNĐ
          </Tag>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      render: (v) => v ? new Date(v).toLocaleString("vi-VN") : ""
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, r) => {
        const payment = r.payment;
        if (!payment) return <Tag>N/A</Tag>;

        let color = 'default';
        let text = payment.status;

        if (payment.status === 'completed') {
          color = 'success';
          text = 'Đã thanh toán';
        } else if (payment.status === 'pending') {
          color = 'warning';
          text = 'Chờ xử lý';
        } else if (payment.status === 'failed') {
          color = 'error';
          text = 'Thất bại';
        }

        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      }
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, r) => {
        const isPending = r.payment?.status === 'pending';

        if (!isPending) {
          return (
            <Tooltip title="In hóa đơn">
              <Button
                size="small"
                icon={<PrinterOutlined />}
                onClick={() => handlePrint(r)}
              />
            </Tooltip>
          );
        }

        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Tooltip title="In hóa đơn">
              <Button
                size="small"
                icon={<PrinterOutlined />}
                onClick={() => handlePrint(r)}
              />
            </Tooltip>
            <Popconfirm
              title="Xác nhận thanh toán"
              description="Bạn có chắc chắn muốn xác nhận thanh toán này?"
              onConfirm={() => handleUpdateStatus(r.invoice_id, 'completed')}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Tooltip title="Xác nhận thanh toán">
                <Button type="primary" size="small" icon={<CheckOutlined />} style={{ background: '#52c41a' }} />
              </Tooltip>
            </Popconfirm>

            <Popconfirm
              title="Hủy thanh toán"
              description="Bạn có chắc chắn muốn hủy thanh toán này?"
              onConfirm={() => handleUpdateStatus(r.invoice_id, 'failed')}
              okText="Đồng ý"
              cancelText="Không"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Hủy bỏ">
                <Button danger size="small" icon={<CloseOutlined />} />
              </Tooltip>
            </Popconfirm>
          </div>
        );
      }
    }
  ];

  return (
    <Card title="Danh sách hóa đơn">
      <div style={{ marginBottom: 16, display: 'flex', gap: '8px' }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm theo tên KH..."
          allowClear
          style={{ width: 250 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 150 }}
          onChange={setFilterStatus}
        >
          <Option value="completed">Đã thanh toán</Option>
          <Option value="pending">Chờ xử lý</Option>
          <Option value="failed">Thất bại</Option>
        </Select>
      </div>

      <Table
        rowKey="invoice_id"
        columns={columns}
        dataSource={filteredInvoices}
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
    </Card>
  );
};

export default Invoices;
