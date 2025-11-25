// src/pages/Customers.jsx
import { useMemo, useState } from 'react';
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
import { MOCK_CUSTOMERS } from '../mock/customers.js';

const Customers = () => {
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // search theo tên hoặc sđt
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const keyword = searchText.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(keyword) ||
        c.phone.includes(keyword)
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

  const handleDelete = (id) => {
    setCustomers(prev => prev.filter(c => c.customer_id !== id));
    message.success('Đã xóa khách hàng');
  };

  const handleSubmitForm = (values) => {
    if (editingCustomer) {
      // update
      setCustomers(prev =>
        prev.map(c =>
          c.customer_id === editingCustomer.customer_id
            ? { ...c, ...values }
            : c
        )
      );
      message.success('Cập nhật khách hàng thành công');
    } else {
      // create
      const newCustomer = {
        customer_id: Date.now(), // fake id
        ...values,
      };
      setCustomers(prev => [...prev, newCustomer]);
      message.success('Thêm khách hàng thành công');
    }

    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'customer_id',
      key: 'customer_id',
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
      title: 'CCCD',
      dataIndex: 'id_card',
      key: 'id_card',
      width: 150,
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
            onConfirm={() => handleDelete(record.customer_id)}
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
        rowKey="customer_id"
        columns={columns}
        dataSource={filteredCustomers}
        pagination={{ pageSize: 5 }}
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
