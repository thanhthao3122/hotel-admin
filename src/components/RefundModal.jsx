import React from "react";
import { Modal, Form, Input, Descriptions, message } from "antd";
import invoiceApi from "../api/invoiceApi";

const RefundModal = ({ open, onCancel, invoice, onSuccess }) => {
  const [percentRetained, setPercentRetained] = React.useState(0);
  const totalAmount = Number(invoice?.total_amount || 0);
  const roomCharge = Number(invoice?.room_charge || 0);
  const serviceCharge = Number(invoice?.service_charge || 0);
  const refundAmount = roomCharge * (1 - percentRetained / 100);

  const handleRefund = async () => {
    try {
      await invoiceApi.refund(invoice.invoice_id, {
        percent_retained: percentRetained,
        refund_amount: refundAmount,
      });
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
        <Descriptions.Item label="Tổng tiền phòng">
          <b>{roomCharge.toLocaleString("vi-VN")} VNĐ</b>
        </Descriptions.Item>
        <Descriptions.Item label="Phần trăm giữ lại (%)">
          <Form.Item style={{ marginBottom: 0 }}>
            <Input
              type="number"
              min={0}
              max={100}
              value={percentRetained}
              onChange={(e) => setPercentRetained(Number(e.target.value))}
              suffix="%"
            />
          </Form.Item>
        </Descriptions.Item>
        <Descriptions.Item label="Số tiền hoàn lại">
          <b style={{ color: "#ff4d4f" }}>
            {refundAmount.toLocaleString("vi-VN")} VNĐ
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
