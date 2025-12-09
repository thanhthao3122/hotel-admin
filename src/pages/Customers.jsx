// src/pages/Customers.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Input,
  Space,
  Table,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import CustomerForm from '../components/CustomerForm.jsx';
import userApi from '../api/userApi.js';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch customers from API
  const fetchCustomers = async (page = pagination.current, limit = pagination.pageSize) => {
    try {
      setLoading(true);
      const res = await userApi.getAll(page, limit);
      setCustomers(res.data || []);
      if (res.pagination) {
        setPagination({
          current: res.pagination.page,
          pageSize: res.pagination.limit,
          total: res.pagination.total,
        });
      }
    } catch (error) {
      console.error(error);
      message.error('Không tải được danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, pagination.pageSize);
  }, []);

  // search theo tên hoặc sđt
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const keyword = searchText.toLowerCase();
      return (
        c.full_name?.toLowerCase().includes(keyword) ||
        c.phone?.includes(keyword) ||
        c.email?.toLowerCase().includes(keyword)
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

  const handleDelete = async (id) => {
    try {
      await userApi.delete(id);
      message.success('Đã xóa khách hàng');
      fetchCustomers();
    } catch (error) {
      console.error(error);
      message.error('Không xóa được khách hàng');
    }
  };

  const handleSubmitForm = async (values) => {
    try {
      if (editingCustomer) {
        // update
        await userApi.update(editingCustomer.user_id, values);
        message.success('Cập nhật khách hàng thành công');
      } else {
        // create
        await userApi.create(values);
        message.success('Thêm khách hàng thành công');
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error(error);
      message.error('Có lỗi khi lưu khách hàng');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 80,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 100,
    },
    {
      title: 'Hành động',
      key: 'actions',
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
              danger
              icon={<DeleteOutlined />}
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
          onChange={e => setSearchText(e.target.value)}
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
          pageSizeOptions: ['5', '10', '20'],
        }}
        onChange={(pager) => {
          const { current, pageSize } = pager;
          setPagination(prev => ({ ...prev, current, pageSize }));
          fetchCustomers(current, pageSize);
        }}
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
