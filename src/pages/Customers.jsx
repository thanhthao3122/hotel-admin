// src/pages/Customers.jsx
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Space, Table, Popconfirm, message } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import CustomerForm from "../components/CustomerForm.jsx";
import userApi from "../api/userApi";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  // state phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ====== GỌI API LẤY DS KHÁCH HÀNG ======
  const fetchCustomers = async (page = 1, limit = pagination.pageSize) => {
    try {
      setLoading(true);
      const res = await userApi.getAll(page, limit);
      // backend dùng paginationResponse: { success, data, pagination }
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

  // load lần đầu
  useEffect(() => {
    fetchCustomers(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // search theo tên hoặc sđt (lọc trên data đã load)
  const filteredCustomers = useMemo(() => {
    const keyword = searchText.toLowerCase();
    return customers.filter((c) => {
      return (
        c.full_name.toLowerCase().includes(keyword) ||
        (c.phone && c.phone.includes(keyword))
      );
    });
  }, [customers, searchText]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  // Xóa khách hàng – gọi API thật
  const handleDelete = async (id) => {
    try {
      await userApi.remove(id);
      message.success("Đã xóa khách hàng");
      fetchCustomers(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
      message.error("Không xóa được khách hàng");
    }
  };

  // Submit form: create / update qua API
  const handleSubmitForm = async (values) => {
    try {
      if (editingCustomer) {
        // UPDATE
        await userApi.update(editingCustomer.user_id, values);
        message.success("Cập nhật khách hàng thành công");
      } else {
        // CREATE
        await userApi.create(values);
        message.success("Thêm khách hàng thành công");
      }

      setIsModalOpen(false);
      setEditingCustomer(null);
      // reload danh sách
      fetchCustomers(1, pagination.pageSize);
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Có lỗi khi lưu khách hàng";
      message.error(msg);
    }
  };

  // đổi trang / pageSize
  const handleTableChange = (pager) => {
    const { current, pageSize } = pager;
    setPagination((prev) => ({
      ...prev,
      current,
      pageSize,
    }));
    fetchCustomers(current, pageSize);
  };

  const columns = [
    {
      title: "ID",
      key: "index",
      width: 80,
      align: "center",
      render: (text, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Họ và tên",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 140,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "CCCD",
      dataIndex: "id_card",
      key: "id_card",
      width: 150,
    },
    {
      title: "Hành động",
      key: "actions",
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
                backgroundColor: "#ff4d4f", // đỏ dịu 
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Thêm khách hàng
        </Button>
      }
    >
      {/* Search */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo tên hoặc số điện thoại..."
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
        onChange={handleTableChange}
      />

      {/* Modal Thêm/Sửa */}
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
