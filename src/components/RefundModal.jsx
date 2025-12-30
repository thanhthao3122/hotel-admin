import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Select, Space, Descriptions, Divider, message, Button } from 'antd';
import paymentApi from '../api/paymentApi';

const RefundModal = ({ open, onCancel, invoice, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [refundAmount, setRefundAmount] = useState(0);
    const [feePercent, setFeePercent] = useState(0);

    const financials = invoice?.financials;
    const maxRefundable = financials?.netPaid || 0;

    useEffect(() => {
        if (open) {
            form.resetFields();
            setRefundAmount(maxRefundable);
            setFeePercent(0);
            form.setFieldsValue({
                amount_refunded: maxRefundable,
                fee_percentage: 0
            });
        }
    }, [open, maxRefundable]);

    const handleValuesChange = (changedValues, allValues) => {
        if ('fee_percentage' in changedValues || 'amount_refunded' in changedValues) {
            // Logic tự động tính toán nếu cần, nhưng ở đây ta để admin tự nhập số tiền hoàn cuối cùng
        }
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);
            const payload = {
                booking_id: invoice.booking_id,
                ...values
            };
            await paymentApi.createRefund(payload);
            message.success('Tạo phiếu hoàn tiền thành công');
            onSuccess();
            onCancel();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Lỗi khi tạo hoàn tiền');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Quản lý hoàn tiền"
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={loading}
            okText="Xác nhận hoàn tiền"
            cancelText="Hủy"
            width={600}
        >
            <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Tổng khách đã trả">
                    <b style={{ color: '#52c41a' }}>{new Intl.NumberFormat('vi-VN').format(financials?.totalPaid || 0)} VNĐ</b>
                </Descriptions.Item>
                <Descriptions.Item label="Đã hoàn trước đó">
                    <span style={{ color: '#ff4d4f' }}>{new Intl.NumberFormat('vi-VN').format(financials?.totalRefunded || 0)} VNĐ</span>
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền có thể hoàn tối đa">
                    <b style={{ color: '#1890ff' }}>{new Intl.NumberFormat('vi-VN').format(maxRefundable)} VNĐ</b>
                </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={handleValuesChange}
                initialValues={{ refund_method: 'cash' }}
            >
                <Space align="start" style={{ width: '100%' }}>
                    <Form.Item
                        name="fee_percentage"
                        label="% Phí dịch vụ (Deduction)"
                        tooltip="Phần trăm phí giữ lại của khách (vốn không hoàn trả)"
                    >
                        <InputNumber
                            min={0}
                            max={100}
                            style={{ width: 200 }}
                            formatter={(value) => `${value}%`}
                            parser={(value) => value.replace('%', '')}
                            onChange={(val) => {
                                const newAmount = maxRefundable * (1 - (val || 0) / 100);
                                form.setFieldsValue({ amount_refunded: Math.floor(newAmount) });
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="amount_refunded"
                        label="Số tiền thực hoàn"
                        rules={[{ required: true, message: 'Nhập số tiền hoàn' }]}
                    >
                        <InputNumber
                            style={{ width: 250 }}
                            min={0}
                            max={maxRefundable}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                            parser={(value) => value.replace(/\./g, '')}
                            addonAfter="VNĐ"
                        />
                    </Form.Item>
                </Space>

                <Form.Item
                    name="refund_method"
                    label="Phương thức hoàn tiền"
                    rules={[{ required: true }]}
                >
                    <Select>
                        <Select.Option value="cash">Tiền mặt</Select.Option>
                        <Select.Option value="vnpay">Hoàn tiền qua VNPay</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="reason"
                    label="Lý do hoàn tiền"
                    rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
                >
                    <Input.TextArea rows={3} placeholder="VD: Khách hủy phòng trước 24h, hoàn lại 90%..." />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RefundModal;
