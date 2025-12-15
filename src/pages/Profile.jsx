import { useState, useEffect } from "react";
import {
    Card,
    Form,
    Input,
    Button,
    Space,
    message,
    Divider,
    Row,
    Col,
    Typography,
    Tag,
} from "antd";
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    LockOutlined,
    EditOutlined,
    SaveOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import authApi from "../api/authApi";

const { Title, Text } = Typography;

const Profile = () => {
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userInfo, setUserInfo] = useState(null);

    // Lấy thông tin profile khi component mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await authApi.getProfile();
            const userData = response.data;
            setUserInfo(userData);
            profileForm.setFieldsValue({
                full_name: userData.full_name,
                email: userData.email,
                phone: userData.phone,
            });
        } catch (error) {
            console.error(error);
            message.error("Không thể tải thông tin tài khoản");
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật thông tin profile
    const handleUpdateProfile = async (values) => {
        try {
            setLoading(true);
            await authApi.updateProfile(values);
            message.success("Cập nhật thông tin thành công");
            setIsEditing(false);
            fetchProfile();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Cập nhật thất bại");
        } finally {
            setLoading(false);
        }
    };

    // Đổi mật khẩu
    const handleChangePassword = async (values) => {
        try {
            setLoading(true);
            await authApi.changePassword({
                current_password: values.current_password,
                new_password: values.new_password,
            });
            message.success("Đổi mật khẩu thành công");
            passwordForm.resetFields();
        } catch (error) {
            console.error(error);
            message.error(
                error.response?.data?.message || "Đổi mật khẩu thất bại"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        profileForm.setFieldsValue({
            full_name: userInfo.full_name,
            email: userInfo.email,
            phone: userInfo.phone,
        });
    };

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <Row gutter={[24, 24]}>
                {/* Thông tin cá nhân */}
                <Col xs={24} lg={14}>
                    <Card
                        title={
                            <Space>
                                <UserOutlined />
                                <span>Thông tin cá nhân</span>
                            </Space>
                        }
                        extra={
                            !isEditing ? (
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => setIsEditing(true)}
                                >
                                    Chỉnh sửa
                                </Button>
                            ) : null
                        }
                        loading={loading}
                    >
                        <Form
                            form={profileForm}
                            layout="vertical"
                            onFinish={handleUpdateProfile}
                        >
                            <Form.Item
                                label="Họ và tên"
                                name="full_name"
                                rules={[
                                    { required: true, message: "Vui lòng nhập họ tên" },
                                ]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Nhập họ và tên"
                                    disabled={!isEditing}
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: "Vui lòng nhập email" },
                                    { type: "email", message: "Email không hợp lệ" },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined />}
                                    placeholder="Nhập email"
                                    disabled={!isEditing}
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Số điện thoại"
                                name="phone"
                                rules={[
                                    { required: true, message: "Vui lòng nhập số điện thoại" },
                                ]}
                            >
                                <Input
                                    prefix={<PhoneOutlined />}
                                    placeholder="Nhập số điện thoại"
                                    disabled={!isEditing}
                                    size="large"
                                />
                            </Form.Item>

                            {userInfo && (
                                <Form.Item label="Vai trò">
                                    <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>
                                        {userInfo.role === "admin"
                                            ? "Quản trị viên"
                                            : userInfo.role === "staff"
                                                ? "Nhân viên"
                                                : "Người dùng"}
                                    </Tag>
                                </Form.Item>
                            )}

                            {isEditing && (
                                <Form.Item>
                                    <Space>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            icon={<SaveOutlined />}
                                            loading={loading}
                                        >
                                            Lưu thay đổi
                                        </Button>
                                        <Button
                                            icon={<CloseOutlined />}
                                            onClick={handleCancelEdit}
                                        >
                                            Hủy
                                        </Button>
                                    </Space>
                                </Form.Item>
                            )}
                        </Form>
                    </Card>
                </Col>

                {/* Đổi mật khẩu */}
                <Col xs={24} lg={10}>
                    <Card
                        title={
                            <Space>
                                <LockOutlined />
                                <span>Đổi mật khẩu</span>
                            </Space>
                        }
                    >
                        <Form
                            form={passwordForm}
                            layout="vertical"
                            onFinish={handleChangePassword}
                        >
                            <Form.Item
                                label="Mật khẩu hiện tại"
                                name="current_password"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập mật khẩu hiện tại",
                                    },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Nhập mật khẩu hiện tại"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Mật khẩu mới"
                                name="new_password"
                                rules={[
                                    { required: true, message: "Vui lòng nhập mật khẩu mới" },
                                    {
                                        min: 6,
                                        message: "Mật khẩu phải có ít nhất 6 ký tự",
                                    },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Nhập mật khẩu mới"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Xác nhận mật khẩu mới"
                                name="confirm_password"
                                dependencies={["new_password"]}
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng xác nhận mật khẩu mới",
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue("new_password") === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(
                                                new Error("Mật khẩu xác nhận không khớp")
                                            );
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Xác nhận mật khẩu mới"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<LockOutlined />}
                                    loading={loading}
                                    block
                                >
                                    Đổi mật khẩu
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;
