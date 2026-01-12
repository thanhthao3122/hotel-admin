import React from "react";
import { Modal, Form, Input, Descriptions, message } from "antd";
import invoiceApi from "../api/invoiceApi";

const RefundModal = ({ open, onCancel, invoice, onSuccess }) => {
  const [form] = Form.useForm();

  const handleRefund = async () => {
    try {
      await invoiceApi.refund(invoice.invoice_id);
      message.success("Hoàn tiền thành công!");
      onSuccess();
      onCancel();
    } catch (error) {
      message.error(error.response?.data?.message || "Hoàn tiền thất bại");
    }
  };
  return (
    <Modal
      title={`Hoàn tiền hóa đơn #${invoice?.invoice_id}`}
      open={open}
      onCancel={onCancel}
      onOk={handleRefund}
      okText="Xác nhận hoàn tiền"
      okButtonProps={{ danger: true }}
    >
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Tổng tiền">
          <b>
            {Number(invoice?.total_amount || 0).toLocaleString("vi-VN")} VNĐ
          </b>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái hiện tại">
          {invoice?.status}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default RefundModal;
