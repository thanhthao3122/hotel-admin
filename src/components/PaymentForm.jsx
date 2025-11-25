// src/components/PaymentForm.jsx
import { Form, InputNumber, Modal, Select } from "antd";
import { useEffect } from "react";

const { Option } = Select;

const PaymentForm = ({
  open,
  onCancel,
  onSubmit,
  booking,
  roomTypes,
  servicesUsage,
}) => {
  const [form] = Form.useForm();

  // Tính tiền phòng = số ngày * giá theo đêm
  const calcRoomCharge = () => {
    const roomType = roomTypes.find(
      (rt) => rt.room_type_id === booking.room_type_id
    );

    const price = roomType.base_price;
    const nights =
      (new Date(booking.check_out) - new Date(booking.check_in)) /
      (1000 * 60 * 60 * 24);

    return price * nights;
  };

  // Tính tiền dịch vụ
  const calcServiceCharge = () => {
    return servicesUsage
      .filter((u) => u.booking_id === booking.booking_id)
      .reduce((s, u) => s + u.total_price, 0);
  };

  const roomCharge = calcRoomCharge();
  const serviceCharge = calcServiceCharge();
  const totalAmount = roomCharge + serviceCharge;

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        room_charge: roomCharge,
        service_charge: serviceCharge,
        total_amount: totalAmount,
        payment_method: "CASH",
      });
    }
  }, [open]);

  return (
    <Modal
      open={open}
      title="Thanh toán"
      onCancel={onCancel}
      okText="Xác nhận thanh toán"
      onOk={() => {
        form.validateFields().then((values) => {
          onSubmit(values);
          form.resetFields();
        });
      }}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item label="Tiền phòng (VNĐ)" name="room_charge">
          <InputNumber
            readOnly
            style={{ width: "100%" }}
            formatter={(v) => v.toLocaleString("vi-VN")}
          />
        </Form.Item>

        <Form.Item label="Tiền dịch vụ (VNĐ)" name="service_charge">
          <InputNumber
            readOnly
            style={{ width: "100%" }}
            formatter={(v) => v.toLocaleString("vi-VN")}
          />
        </Form.Item>

        <Form.Item label="Tổng cộng (VNĐ)" name="total_amount">
          <InputNumber
            readOnly
            style={{ width: "100%" }}
            formatter={(v) => v.toLocaleString("vi-VN")}
          />
        </Form.Item>

        <Form.Item
          label="Hình thức thanh toán"
          name="payment_method"
          rules={[{ required: true, message: "Chọn phương thức thanh toán" }]}
        >
          <Select>
            <Option value="CASH">Tiền mặt</Option>
            <Option value="BANKING">Chuyển khoản</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PaymentForm;
