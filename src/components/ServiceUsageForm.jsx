// src/components/ServiceUsageForm.jsx
import { Form, InputNumber, Modal, Select } from 'antd';
import { useEffect, useState, useMemo } from 'react';

const { Option } = Select;

const ServiceUsageForm = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  isEditing,
  bookings,
  services,
  customers,
}) => {
  const [form] = Form.useForm();
  const [pricePerUnit, setPricePerUnit] = useState(0);

  // Map id -> object để tiện lookup
  // NOTE: booking.user_id, không phải customer_id
  const customerMap = useMemo(() => Object.fromEntries(customers.map(c => [c.user_id, c])), [customers]);
  const serviceMap = useMemo(() => Object.fromEntries(services.map(s => [s.service_id, s])), [services]);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        const service = serviceMap[initialValues.service_id];
        setPricePerUnit(service?.price || 0);

        form.setFieldsValue({
          booking_id: initialValues.booking_id,
          service_id: initialValues.service_id,
          quantity: initialValues.quantity,
        });
      } else {
        form.resetFields();
        setPricePerUnit(0);
      }
    }
  }, [open, initialValues, serviceMap, form]);

  const handleServiceChange = service_id => {
    const service = serviceMap[service_id];
    setPricePerUnit(service?.price || 0);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const service = serviceMap[values.service_id];
      const price = service?.price || 0;
      const total_price = price * values.quantity;

      onSubmit({
        booking_id: values.booking_id,
        service_id: values.service_id,
        quantity: values.quantity,
        total_price,
      });

      form.resetFields();
    });
  };

  // render label booking: #id - tên KH - phòng
  const renderBookingLabel = booking => {
    const customer = customerMap[booking.user_id];

    // Lấy room từ booking.bookingRooms
    const roomNumbers = booking.bookingRooms?.map(br => br.room?.room_number).filter(Boolean) || [];
    const roomText = roomNumbers.length > 0 ? `Phòng ${roomNumbers.join(', ')}` : 'N/A';

    const statusText = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      checked_in: 'Đang ở',
      checked_out: 'Đã trả phòng',
      cancelled: 'Đã hủy'
    }[booking.status] || booking.status;

    return `#${booking.booking_id} - ${customer?.full_name || 'N/A'} - ${roomText} (${statusText})`;
  };

  return (
    <Modal
      title={isEditing ? 'Chỉnh sửa sử dụng dịch vụ' : 'Thêm sử dụng dịch vụ'}
      open={open}
      onOk={handleOk}
      onCancel={() => {
        console.log("Closing ServiceUsageForm");
        form.resetFields();
        onCancel();
      }}
      okText={isEditing ? 'Lưu' : 'Thêm'}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={(changedValues, allValues) => {
          if (changedValues.service_id) {
            const service = serviceMap[changedValues.service_id];
            setPricePerUnit(service?.price || 0);
          }
        }}
      >
        <Form.Item
          label="Đơn đặt phòng"
          name="booking_id"
          rules={[{ required: true, message: 'Vui lòng chọn đơn đặt phòng' }]}
        >
          <Select placeholder="Chọn booking">
            {bookings.map(b => (
              <Option key={b.booking_id} value={b.booking_id}>
                {renderBookingLabel(b)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Dịch vụ"
          name="service_id"
          rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
        >
          <Select placeholder="Chọn dịch vụ">
            {services.map(s => (
              <Option key={s.service_id} value={s.service_id}>
                {s.name} - {parseFloat(s.price).toLocaleString('vi-VN')} VNĐ / {s.unit}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Số lượng"
          name="quantity"
          rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
          initialValue={1}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Đơn giá (VNĐ)">
          <InputNumber
            style={{ width: '100%' }}
            readOnly
            value={pricePerUnit}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
          />
        </Form.Item>

        <Form.Item shouldUpdate={(prevValues, curValues) => prevValues.quantity !== curValues.quantity}>
          {() => (
            <Form.Item label="Tổng tiền (VNĐ)">
              <InputNumber
                style={{ width: '100%' }}
                readOnly
                value={pricePerUnit * (form.getFieldValue('quantity') || 0)}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              />
            </Form.Item>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ServiceUsageForm;
