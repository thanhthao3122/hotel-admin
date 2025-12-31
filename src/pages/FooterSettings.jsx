import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Spin } from 'antd';
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';
import axios from 'axios';

const FooterSettings = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Lấy thông tin footer khi component mount
    useEffect(() => {
        fetchFooterSettings();
    }, []);

    const fetchFooterSettings = async () => {
        try {
            setFetching(true);
            const response = await axios.get('http://localhost:5000/api/footer');
            if (response.data.success) {
                form.setFieldsValue(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching footer settings:', error);
            message.error('Không thể tải thông tin footer');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.put(
                'http://localhost:5000/api/footer',
                values,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                message.success('Cập nhật thông tin footer thành công!');
            }
        } catch (error) {
            console.error('Error updating footer settings:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Card
                title={
                    <span>
                        <SettingOutlined style={{ marginRight: 8 }} />
                        Cài đặt Footer
                    </span>
                }
                bordered={false}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại' },
                            { pattern: /^[0-9\s]+$/, message: 'Số điện thoại không hợp lệ' }
                        ]}
                    >
                        <Input
                            placeholder="VD: 1900 123 456"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                    >
                        <Input
                            placeholder="VD: support@booking.com"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Địa chỉ"
                        name="address"
                        rules={[
                            { required: true, message: 'Vui lòng nhập địa chỉ' }
                        ]}
                    >
                        <Input
                            placeholder="VD: Hà Nội, Việt Nam"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Link Google Maps"
                        name="google_maps_url"
                        help="Dán link từ Google Maps vào đây để khi click vào địa chỉ sẽ mở bản đồ"
                    >
                        <Input
                            placeholder="VD: https://www.google.com/maps/place/..."
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Link Facebook"
                        name="facebook_url"
                    >
                        <Input
                            placeholder="VD: https://facebook.com/yourpage"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Link Instagram"
                        name="instagram_url"
                    >
                        <Input
                            placeholder="VD: https://instagram.com/yourpage"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Link Twitter"
                        name="twitter_url"
                    >
                        <Input
                            placeholder="VD: https://twitter.com/yourpage"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={loading}
                            size="large"
                            block
                        >
                            Lưu thay đổi
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default FooterSettings;
