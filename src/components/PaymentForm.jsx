// src/components/PaymentForm.jsx
import { Form, InputNumber, Modal, Select, Input, Typography, Divider, Descriptions } from "antd";
import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";

const { Option } = Select;
const { Text } = Typography;

const PaymentForm = ({
  open,
  onCancel,
  onSubmit,
  bookings = [], // Danh sách các booking đang chờ để chọn
  initialBooking = null, // Nếu thanh toán cho một booking cụ thể được truyền từ component cha
}) => {
  const [form] = Form.useForm();
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialBooking) {
        setSelectedBookingId(initialBooking.booking_id);
        form.setFieldValue('booking_id', initialBooking.booking_id);
      } else {
        setSelectedBookingId(null);
      }
    }
  }, [open, initialBooking]);

  const selectedBooking = useMemo(() => {
    if (!selectedBookingId) return null;
    return bookings.find(b => b.booking_id === selectedBookingId) || initialBooking;
  }, [selectedBookingId, bookings, initialBooking]);

  const bookingDetails = useMemo(() => {
    if (!selectedBooking) return null;

    const checkIn = dayjs(selectedBooking.checkin_date);
    const checkOut = dayjs(selectedBooking.checkout_date);
    const nights = Math.max(1, checkOut.diff(checkIn, 'day'));

    // Kiểm tra cấu trúc mảng phòng
    const rooms = selectedBooking.rooms || [];

    // Tính tổng tiền phòng
    // Backend: tổng(giá_mỗi_đêm * số_đêm)
    const roomTotal = rooms.reduce((sum, room) => {
      // Xử lý room.BookingRoom?.price_per_night nếu lồng nhau, hoặc room.price_per_night nếu trực tiếp
      const price = parseFloat(room.BookingRoom?.price_per_night || room.price_per_night || 0);
      return sum + (price * nights);
    }, 0);

    // Tính tổng tiền dịch vụ
    // Kiểm tra xem dịch vụ có được bao gồm trong đối tượng booking không
    const services = selectedBooking.services || [];
    const serviceTotal = services.reduce((sum, s) => {
      return sum + parseFloat(s.ServiceUsage?.total_price || 0);
    }, 0);

    return {
      customerName: selectedBooking.user?.full_name || 'Khách vãng lai',
      nights,
      roomTotal,
      serviceTotal,
      grandTotal: roomTotal + serviceTotal
    };
  }, [selectedBooking]);

  return (
    <Modal
      open={open}
      title="Tạo thanh toán mới"
      onCancel={onCancel}
      okText="Xác nhận thanh toán"
      onOk={() => {
        form.validateFields().then((values) => {
          onSubmit({
            booking_id: values.booking_id,
            notes: values.notes
          });
          form.resetFields();
        });
      }}
      destroyOnHidden
      width={600}
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Chọn Booking cần thanh toán"
          name="booking_id"
          rules={[{ required: true, message: "Vui lòng chọn booking" }]}
        >
          <Select
            placeholder="Tìm kiếm booking..."
            showSearch
            optionFilterProp="children"
            onChange={setSelectedBookingId}
            disabled={!!initialBooking}
          >
            {bookings.map(b => (
              <Option key={b.booking_id} value={b.booking_id}>
                #{b.booking_id} - {b.user?.full_name} ({dayjs(b.checkin_date).format('DD/MM')} - {dayjs(b.checkout_date).format('DD/MM')})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedBooking && bookingDetails && (
          <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <Descriptions title="Chi tiết thanh toán" column={1} size="small">
              <Descriptions.Item label="Khách hàng">{bookingDetails.customerName}</Descriptions.Item>
              <Descriptions.Item label="Thời gian lưu trú">{bookingDetails.nights} đêm</Descriptions.Item>
              <Descriptions.Item label="Tiền phòng">
                {bookingDetails.roomTotal.toLocaleString('vi-VN')} VNĐ
              </Descriptions.Item>
              <Descriptions.Item label="Tiền dịch vụ">
                {bookingDetails.serviceTotal.toLocaleString('vi-VN')} VNĐ
              </Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: '16px' }}>Tổng cộng:</Text>
              <Text strong style={{ fontSize: '18px', color: '#1677ff' }}>
                {bookingDetails.grandTotal.toLocaleString('vi-VN')} VNĐ
              </Text>
            </div>
          </div>
        )}

        <Form.Item label="Ghi chú" name="notes">
          <Input.TextArea rows={3} placeholder="Ghi chú thanh toán..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PaymentForm;
