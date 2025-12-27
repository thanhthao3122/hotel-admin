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
        // Handle case where booking has rooms array
        const roomId = initialValues.room_id || (initialValues.rooms && initialValues.rooms.length > 0 ? initialValues.rooms[0].room_id : null);

        let roomTypeBasePrice = 0;

        if (roomId) {
          const room = rooms.find(r => r.room_id === roomId);
          if (room) {
            const roomType = roomTypes.find(rt => rt.room_type_id === room.room_type_id);
            if (roomType) {
              roomTypeBasePrice = roomType.base_price;
            }
          }
        }

        setPricePerNight(roomTypeBasePrice);

        form.setFieldsValue({
          ...initialValues,
          room_id: roomId,
          payment_method: initialValues.payment_method || 'pay_later',
          check_in: dayjs(initialValues.checkin_date || initialValues.check_in),
          check_out: dayjs(initialValues.checkout_date || initialValues.check_out),
        });
      } else {
        form.resetFields();
        setPricePerNight(0);
      }
    }
  }, [open, initialValues, rooms, roomTypes, form]); // Add dependencies

  const handleRoomSelect = (room_id) => {
    const room = rooms.find(r => r.room_id === room_id);
    if (!room) return;

    const roomType = roomTypes.find(rt => rt.room_type_id === room.room_type_id);
    if (roomType) {
      setPricePerNight(roomType.base_price);
    }
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const nights = dayjs(values.check_out).diff(dayjs(values.check_in), 'day');
      const total_price = nights * pricePerNight;

      onSubmit({
        user_id: values.user_id,
        checkin_date: values.check_in.format("YYYY-MM-DD"),
        checkout_date: values.check_out.format("YYYY-MM-DD"),
        rooms: [{
          room_id: values.room_id,
          price_per_night: pricePerNight // Ensure price is passed
        }],
        source: 'admin',
        payment_method: values.payment_method
      });

      form.resetFields();
    });
  };

  return (
    <Modal
      title={isEditing ? 'Sửa đặt phòng' : 'Tạo 1 đặt phòng'}
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
          name="user_id"
          rules={[{ required: true, message: 'Chọn khách hàng' }]}
        >
          <Select placeholder="Chọn khách hàng">
            {customers.map(c => (
              <Option value={c.user_id} key={c.user_id}>
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
              .filter(r => r.status === 'available' || (initialValues && initialValues.room_id === r.room_id) || (initialValues && initialValues.rooms && initialValues.rooms.some(br => br.room_id === r.room_id)))
              .map(r => (
                <Option key={r.room_id} value={r.room_id}>
                  Phòng {r.room_number}
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
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            disabledDate={(current) => {
              // Can not select days before today
              return current && current < dayjs().startOf('day');
            }}
            onChange={(date) => {
              // Reset check_out if it becomes invalid (must be strictly after check_in)
              const checkOut = form.getFieldValue('check_out');
              if (checkOut && date && (checkOut.isBefore(date) || checkOut.isSame(date, 'day'))) {
                form.setFieldValue('check_out', null);
              }
            }}
          />
        </Form.Item>

        <Form.Item
          label="Ngày trả phòng"
          name="check_out"
          rules={[
            { required: true, message: 'Chọn ngày trả' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || !getFieldValue('check_in')) {
                  return Promise.resolve();
                }
                if (value.isAfter(getFieldValue('check_in'))) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Ngày trả phòng phải sau ngày nhận phòng!'));
              },
            }),
          ]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            disabledDate={(current) => {
              const checkIn = form.getFieldValue('check_in');
              if (checkIn) {
                return current && current <= checkIn.endOf('day');
              }
              return current && current < dayjs().endOf('day');
            }}
          />
        </Form.Item>

        <Form.Item
          label="Phương thức thanh toán"
          name="payment_method"
          rules={[{ required: true, message: 'Chọn phương thức thanh toán' }]}
          initialValue="pay_later"
        >
          <Select>
            <Option value="online">Thanh toán trực tuyến</Option>
            <Option value="pay_later">Thanh toán tại quầy</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingForm;
