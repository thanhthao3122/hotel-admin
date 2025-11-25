import { Form, Select, DatePicker, Modal, InputNumber } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

const { Option } = Select;

const BookingForm = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  customers,
  rooms,
  roomTypes,
  isEditing,
}) => {
  const [form] = Form.useForm();
  const [pricePerNight, setPricePerNight] = useState(0);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        const room = rooms.find(r => r.room_id === initialValues.room_id);
        const roomType = roomTypes.find(rt => rt.room_type_id === room.room_type_id);

        setPricePerNight(roomType.base_price);

        form.setFieldsValue({
          ...initialValues,
          check_in: dayjs(initialValues.check_in),
          check_out: dayjs(initialValues.check_out),
        });
      } else {
        form.resetFields();
      }
    }
  }, [open]);

  const handleRoomSelect = (room_id) => {
    const room = rooms.find(r => r.room_id === room_id);
    const roomType = roomTypes.find(rt => rt.room_type_id === room.room_type_id);
    setPricePerNight(roomType.base_price);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const nights = dayjs(values.check_out).diff(dayjs(values.check_in), 'day');
      const total_price = nights * pricePerNight;

      onSubmit({
        ...values,
        check_in: values.check_in.format("YYYY-MM-DD"),
        check_out: values.check_out.format("YYYY-MM-DD"),
        total_price,
      });

      form.resetFields();
    });
  };

  return (
    <Modal
      title={isEditing ? 'Sửa đặt phòng' : 'Tạo đặt phòng'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={isEditing ? 'Lưu' : 'Thêm'}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Khách hàng"
          name="customer_id"
          rules={[{ required: true, message: 'Chọn khách hàng' }]}
        >
          <Select placeholder="Chọn khách hàng">
            {customers.map(c => (
              <Option value={c.customer_id} key={c.customer_id}>
                {c.full_name} - {c.phone}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Phòng"
          name="room_id"
          rules={[{ required: true, message: 'Chọn phòng' }]}
        >
          <Select placeholder="Chọn phòng" onChange={handleRoomSelect}>
            {rooms
              .filter(r => r.status === 'AVAILABLE')
              .map(r => (
                <Option key={r.room_id} value={r.room_id}>
                  Phòng {r.room_number} (Tầng {r.floor})
                </Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item label="Giá theo đêm (VNĐ)">
          <InputNumber
            value={pricePerNight}
            readOnly
            style={{ width: "100%" }}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
          />
        </Form.Item>

        <Form.Item
          label="Ngày nhận phòng"
          name="check_in"
          rules={[{ required: true, message: 'Chọn ngày nhận' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Ngày trả phòng"
          name="check_out"
          rules={[{ required: true, message: 'Chọn ngày trả' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingForm;
