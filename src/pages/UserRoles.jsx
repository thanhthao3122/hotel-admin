import { Card, Table, Tag, message, Select, Popconfirm, Input, Modal } from "antd";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import userApi from "../api/userApi";

const { Option } = Select;

const UserRoles = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const fetchUsers = async (page = pagination.current, limit = pagination.pageSize) => {
        try {
            setLoading(true);
            const response = await userApi.getAll(page, limit);
            setUsers(response.data || []);
            if (response.pagination) {
                setPagination({
                    current: response.pagination.page,
                    pageSize: response.pagination.limit,
                    total: response.pagination.total,
                });
            }
        } catch (error) {
            console.error(error);
            message.error("Không tải được danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            setLoading(true);
            await userApi.updateRole(userId, newRole);
            message.success("Đã cập nhật quyền thành công");
            fetchUsers();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Lỗi cập nhật quyền");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const getRoleColor = (role) => {
        const colors = {
            admin: "red",
            staff: "blue",
            user: "green",
        };
        return colors[role] || "default";
    };

    const getRoleText = (role) => {
        const texts = {
            admin: "👑 Quản trị viên",
            staff: "👔 Nhân viên",
            user: "👤 Khách hàng",
        };
        return texts[role] || role;
    };

    const filteredUsers = users.filter((user) =>
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phone?.includes(search)
    );

    const columns = [
        {
            title: "ID",
            dataIndex: "user_id",
            width: 80,
        },
        {
            title: "Họ tên",
            dataIndex: "full_name",
            render: (text) => (
                <span>
                    <UserOutlined style={{ marginRight: 8 }} />
                    {text}
                </span>
            ),
        },
        {
            title: "Email",
            dataIndex: "email",
        },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            render: (text) => text || "—",
        },
        {
            title: "Quyền hiện tại",
            dataIndex: "role",
            render: (role) => (
                <Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>
            ),
        },
        {
            title: "Phân quyền",
            key: "action",
            render: (_, record) => (
                <Select
                    value={record.role}
                    style={{ width: 180 }}
                    onChange={(newRole) => {
                        if (newRole === record.role) return;

                        // Show confirmation modal
                        Modal.confirm({
                            title: "Xác nhận thay đổi quyền",
                            content: `Bạn có chắc muốn đổi quyền của "${record.full_name}" thành "${getRoleText(newRole)}"?`,
                            onOk: () => handleRoleChange(record.user_id, newRole),
                            okText: "Xác nhận",
                            cancelText: "Hủy",
                            okButtonProps: { danger: newRole === 'admin' }
                        });
                    }}
                >
                    <Option value="user">
                        <Tag color="green">👤 Khách hàng</Tag>
                    </Option>
                    <Option value="staff">
                        <Tag color="blue">👔 Nhân viên</Tag>
                    </Option>
                    <Option value="admin">
                        <Tag color="red">👑 Quản trị viên</Tag>
                    </Option>
                </Select>
            ),
        },
    ];

    return (
        <Card title="Phân quyền tài khoản">
            <div style={{ marginBottom: 16 }}>
                <Input
                    prefix={<SearchOutlined />}
                    placeholder="Tìm theo tên, email, SĐT..."
                    allowClear
                    style={{ width: 300 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <Table
                rowKey="user_id"
                columns={columns}
                dataSource={filteredUsers}
                loading={loading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: ["5", "10", "20", "50"],
                }}
                onChange={(pager) => {
                    const { current, pageSize } = pager;
                    setPagination((prev) => ({ ...prev, current, pageSize }));
                    fetchUsers(current, pageSize);
                }}
            />
        </Card>
    );
};

export default UserRoles;
