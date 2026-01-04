import { Modal, Form, Input, message, Descriptions, Tag, Divider } from 'antd';
import { useState, useEffect } from 'react';
import paymentApi from '../../api/paymentApi';

const PaymentModal = ({ visible, onCancel, booking, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState(null);

    useEffect(() => {
        if (booking && visible) {
            calculatePaymentDetails();
        }
    }, [booking, visible]);

    const calculatePaymentDetails = () => {
        if (!booking) return;

        // Use financials from backend if available
        const financials = booking.financials;

        // Calculate nights
        const checkin = new Date(booking.checkin_date);
        const checkout = new Date(booking.checkout_date);
        const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));

        const roomTotal = financials ? parseFloat(financials.roomTotal) : (booking.bookingRooms?.reduce((sum, br) => {
            return sum + (parseFloat(br.price_per_night) * nights);
        }, 0) || 0);

        // Sum service totals
        let serviceTotal = 0;
        if (financials && financials.serviceTotal !== undefined) {
            serviceTotal = parseFloat(financials.serviceTotal);
        } else {
            serviceTotal = booking.bookingRooms?.reduce((sum, br) => {
                const usages = br.serviceUsages || [];
                return sum + usages.reduce((suSum, u) => suSum + parseFloat(u.total_price || 0), 0);
            }, 0) || 0;
        }

        setPaymentDetails({
            nights,
            roomTotal,
            serviceTotal,
            total: roomTotal + serviceTotal
        });
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            await paymentApi.create({
                booking_id: booking.booking_id,
                notes: values.notes
            });

            message.success('Ghi nhận thanh toán thành công!');
            form.resetFields();
            onSuccess();
            onCancel();
        } catch (error) {
            console.error('Error creating payment:', error);
            message.error(error.response?.data?.message || 'Không thể ghi nhận thanh toán');
        } finally {
            setLoading(false);
        }
    };

    if (!booking) return null;

    return (
        <Modal
            title="Ghi nhận thanh toán"
            open={visible}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={loading}
            okText="Xác nhận thanh toán"
            cancelText="Hủy"
            width={600}
        >
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Mã booking">
                    <Tag color="blue">#{booking.booking_id}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Khách hàng">
                    {booking.user?.full_name || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Phòng">
                    {booking.bookingRooms?.map(br => (
                        <Tag key={br.room_id} color="cyan">
                            {br.room?.roomType?.name} - {br.room?.room_number}
                        </Tag>
                    ))}
                </Descriptions.Item>
                <Descriptions.Item label="Check-in">
                    {booking.checkin_date}
                </Descriptions.Item>
                <Descriptions.Item label="Check-out">
                    {booking.checkout_date}
                </Descriptions.Item>
            </Descriptions>

            <Divider>Chi tiết thanh toán</Divider>

            {paymentDetails && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span>Tiền phòng ({paymentDetails.nights} đêm):</span>
                        <span style={{ fontWeight: 'bold' }}>
                            {paymentDetails.roomTotal.toLocaleString('vi-VN')} VNĐ
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span>Dịch vụ:</span>
                        <span style={{ fontWeight: 'bold' }}>
                            {paymentDetails.serviceTotal.toLocaleString('vi-VN')} VNĐ
                        </span>
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Tổng cộng:</span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                            {paymentDetails.total.toLocaleString('vi-VN')} VNĐ
                        </span>
                    </div>
                </div>
            )}

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Phương thức thanh toán"
                >
                    <Input value="Tiền mặt" disabled />
                </Form.Item>

                <Form.Item
                    name="notes"
                    label="Ghi chú (tùy chọn)"
                >
                    <Input.TextArea rows={3} placeholder="Nhập ghi chú nếu có..." />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PaymentModal;
