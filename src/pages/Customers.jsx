import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Input,
  Space,
  Table,
  Popconfirm,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import CustomerForm from "../components/CustomerForm.jsx";
import userApi from "../api/userApi.js";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chỉ khai báo 1 lần
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ==================== Fetch Customers ====================
  const fetchCustomers = async (page = 1, limit = pagination.pageSize) => {
    try {
      setLoading(true);
      const res = await userApi.getAll(page, limit);

      const list = res.data || [];
      const pag = res.pagination;

      setCustomers(list);

      if (pag) {
        setPagination({
          current: pag.page,
          pageSize: pag.limit,
          total: pag.total,
        });
      } else {
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: limit,
          total: list.length,
        }));
      }
    } catch (error) {
      console.error(error);
      message.error("Không tải được danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  // Load lần đầu
  useEffect(() => {
    fetchCustomers(1, pagination.pageSize);
  }, []);

  // ==================== Search Local ====================
  const filteredCustomers = useMemo(() => {
    const keyword = searchText.toLowerCase();
    return customers.filter((c) => {
      return (
        c.full_name?.toLowerCase().includes(keyword) ||
        c.phone?.includes(keyword) ||
        c.email?.toLowerCase().includes(keyword)
      );
    });
  }, [customers, searchText]);

  // ==================== Actions ====================
  const openCreateModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await userApi.delete(id);
      message.success("Đã xóa khách hàng");
      fetchCustomers(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
      message.error("Không xóa được khách hàng");
    }
  };

  const handleSubmitForm = async (values) => {
    try {
      if (editingCustomer) {
        await userApi.update(editingCustomer.user_id, values);
        message.success("Cập nhật khách hàng thành công");
      } else {
        await userApi.create(values);
        message.success("Thêm khách hàng thành công");
      }

      setIsModalOpen(false);
      setEditingCustomer(null);
      fetchCustomers(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
      message.error("Có lỗi khi lưu khách hàng");
    }
  };

  // ==================== Columns ====================
  const columns = [
    {
      title: "STT",
      key: "index",
      width: 80,
      align: "center",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Họ và tên",
      dataIndex: "full_name",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      width: 140,
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      width: 100,
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa khách hàng"
            description={`Bạn có chắc muốn xóa khách hàng "${record.full_name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.user_id)}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: "#ff4d4f",
                borderColor: "#ff4d4f",
                color: "#fff",
              }}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quản lý khách hàng"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Thêm khách hàng
        </Button>
      }
    >
      {/* Search Box */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo tên, số điện thoại, email..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
      </Space>

      {/* Table */}
      <Table
        rowKey="user_id"
        columns={columns}
        dataSource={filteredCustomers}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20"],
        }}
        onChange={(pager) => {
          setPagination((prev) => ({
            ...prev,
            current: pager.current,
            pageSize: pager.pageSize,
          }));
          fetchCustomers(pager.current, pager.pageSize);
        }}
      />

      {/* Modal */}
      <CustomerForm
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSubmitForm}
        initialValues={editingCustomer}
        isEditing={!!editingCustomer}
      />
    </Card>
  );
};

export default Customers;
