import { useState, useEffect } from "react";
import { Table, Tag, Card, Typography, message, Space, Button, Popconfirm, Input, Modal, Form, InputNumber, DatePicker, Select } from "antd";
import { PercentageOutlined, SearchOutlined, DeleteOutlined, EditOutlined, PlusOutlined, BarcodeOutlined } from "@ant-design/icons";
import voucherApi from "../api/voucherApi";
import roomTypeApi from "../api/roomTypeApi";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Vouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const res = await voucherApi.getAll();
            setVouchers(res.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            message.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleDelete = async (id) => {
        try {
            await voucherApi.delete(id);
            message.success("Đã xóa voucher thành công");
            fetchAllData();
        } catch (error) {
            message.error("Lỗi khi xóa voucher");
        }
    };

    const handleAddOrUpdate = async (values) => {
        const start_date = values.dateRange[0].toDate();
        const end_date = values.dateRange[1].toDate();

        const payload = {
            code: values.code,
            description: values.description,
            discount_type: values.discount_type,
            discount_value: values.discount_value,
            start_date,
            end_date,
            max_uses: values.max_uses
        };

        try {
            setLoading(true);
            if (editingId) {
                await voucherApi.update(editingId, payload);
                message.success("Cập nhật voucher thành công");
            } else {
                await voucherApi.create(payload);
                message.success("Thêm voucher thành công");
            }
            setIsModalVisible(false);
            form.resetFields();
            fetchAllData();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Lỗi khi lưu voucher");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record) => {
        setEditingId(record.voucher_id);
        form.setFieldsValue({
            code: record.code,
            discount_type: record.discount_type,
            discount_value: record.discount_value,
            description: record.description,
            max_uses: record.max_uses,
            dateRange: [dayjs(record.start_date), dayjs(record.end_date)],
        });
        setIsModalVisible(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(Math.floor(amount)) + " VNĐ";
    };

    const columns = [
        {
            title: "Mã Voucher",
            dataIndex: "code",
            key: "code",
            render: (text) => <Tag color="blue" style={{ fontWeight: 'bold', fontSize: '14px' }}>{text}</Tag>,
        },
        {
            title: "Mức giảm",
            key: "discount",
            render: (_, record) => {
                const isPercent = record.discount_type === 'percentage';
                return (
                    <Tag color={isPercent ? "volcano" : "green"}>
                        {isPercent ? `${record.discount_value}%` : formatCurrency(record.discount_value)}
                    </Tag>
                );
            },
            sorter: (a, b) => a.discount_value - b.discount_value,
        },
        {
            title: "Lượt dùng",
            key: "usage",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>{record.current_uses} / {record.max_uses}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        Còn lại: {record.max_uses - record.current_uses}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Thời gian",
            key: "duration",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: '12px' }}>{dayjs(record.start_date).format("DD/MM/YYYY")}</Text>
                    <Text style={{ fontSize: '12px' }}>{dayjs(record.end_date).format("DD/MM/YYYY")}</Text>
                </Space>
            ),
        },
        {
            title: "Trạng thái",
            key: "status",
            render: (_, record) => {
                const now = dayjs();
                const start = dayjs(record.start_date);
                const end = dayjs(record.end_date);

                if (record.current_uses >= record.max_uses) return <Tag color="warning">Hết lượt</Tag>;
                if (now.isBefore(start)) return <Tag color="blue">Sắp tới</Tag>;
                if (now.isAfter(end)) return <Tag color="default">Hết hạn</Tag>;
                return <Tag color="green">Đang chạy</Tag>;
            },
        },
        {
            title: "Hành động",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Xác nhận xóa voucher này?"
                        onConfirm={() => handleDelete(record.voucher_id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button size="small" type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filteredVouchers = vouchers.filter(v =>
        v.code?.toLowerCase().includes(searchText.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        v.roomType?.name?.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ padding: "0" }}>
            <Card
                title={
                    <Space>
                        <BarcodeOutlined style={{ color: '#1890ff' }} />
                        <span>QUẢN LÝ MÃ GIẢM GIÁ (VOUCHER)</span>
                    </Space>
                }
                extra={
                    <Space>
                        <Input
                            placeholder="Tìm mã hoặc mô tả..."
                            prefix={<SearchOutlined />}
                            style={{ width: 250 }}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingId(null);
                                form.resetFields();
                                // Set default values
                                form.setFieldsValue({
                                    max_uses: 100,
                                    dateRange: [dayjs(), dayjs().add(1, 'month')]
                                });
                                setIsModalVisible(true);
                            }}
                        >
                            Tạo Voucher
                        </Button>
                    </Space>
                }
                headStyle={{ borderBottom: '1px solid #f0f0f0' }}
            >
                <Table
                    columns={columns}
                    dataSource={filteredVouchers}
                    loading={loading}
                    rowKey="voucher_id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng cộng ${total} voucher`,
                    }}
                />
            </Card>

            <Modal
                title={editingId ? "Sửa Voucher" : "Tạo Voucher mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={650}
            >
                <Form form={form} layout="vertical" onFinish={handleAddOrUpdate}>
                    <Space size="large" style={{ width: '100%', marginBottom: 16 }}>
                        <Form.Item
                            name="code"
                            label="Mã Voucher"
                            rules={[{ required: true, message: "Nhập mã voucher" }]}
                            style={{ width: 200 }}
                        >
                            <Input placeholder="VD: HE2025" style={{ textTransform: 'uppercase' }} />
                        </Form.Item>

                        <Form.Item
                            name="discount_type"
                            label="Loại giảm giá"
                            rules={[{ required: true, message: "Chọn loại" }]}
                            style={{ width: 180 }}
                            initialValue="percentage"
                        >
                            <Select>
                                <Option value="percentage">Phần trăm (%)</Option>
                                <Option value="fixed">Số tiền cố định (VNĐ)</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="discount_value"
                            label="Giá trị giảm"
                            rules={[{ required: true, message: "Nhập giá trị" }]}
                            style={{ width: 160 }}
                        >
                            <InputNumber
                                min={1}
                                style={{ width: '100%' }}
                                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                parser={v => v.replace(/\./g, '')}
                            />
                        </Form.Item>
                    </Space>

                    <Form.Item
                        name="max_uses"
                        label="Số lượt dùng"
                        rules={[{ required: true, message: "Nhập số lượt" }]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả chương trình"
                        rules={[{ required: true, message: "Nhập mô tả" }]}
                    >
                        <Input placeholder="VD: Khuyến mãi chào hè 2025 cho khách hàng mới" />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="Thời gian hiệu lực"
                        rules={[{ required: true, message: "Vui lòng chọn khoảng ngày" }]}
                    >
                        <RangePicker
                            format="DD/MM/YYYY"
                            placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
                        <Space>
                            <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {editingId ? "Cập nhật" : "Tạo mới"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Vouchers;
