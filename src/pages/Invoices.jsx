// src/pages/Invoices.jsx
import { Card, Table, Tag } from "antd";
import { useState } from "react";

import { MOCK_INVOICES } from "../mock/invoices";

const Invoices = () => {
  const [invoices] = useState(MOCK_INVOICES);

  const columns = [
    { title: "Mã HĐ", dataIndex: "invoice_id", width: 100 },
    { title: "Booking", dataIndex: "booking_id" },
    { title: "Khách hàng", dataIndex: "customer_name" },
    { title: "Số phòng", dataIndex: "room_number" },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      render: (v) => (
        <Tag color="blue">{v.toLocaleString("vi-VN")} VNĐ</Tag>
      ),
    },
    { title: "Ngày tạo", dataIndex: "created_at" },
  ];

  return (
    <Card title="Danh sách hóa đơn">
      <Table
        rowKey="invoice_id"
        columns={columns}
        dataSource={invoices}
        pagination={{ pageSize: 5 }}
      />
    </Card>
  );
};

export default Invoices;
