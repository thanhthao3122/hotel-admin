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
import ServiceForm from '../components/ServiceForm.jsx';
import { MOCK_SERVICES } from '../mock/services.js';

const Services = () => {
  const [services, setServices] = useState(MOCK_SERVICES);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const filteredServices = useMemo(
    () =>
      services.filter(s =>
        s.name.toLowerCase().includes(searchText.toLowerCase())
      ),
    [services, searchText]
  );

  const openCreateModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setServices(prev => prev.filter(s => s.service_id !== id));
    message.success('Đã xóa dịch vụ');
  };

  const handleSubmitForm = (values) => {
    if (editingService) {
      setServices(prev =>
        prev.map(s =>
          s.service_id === editingService.service_id
            ? { ...s, ...values }
            : s
        )
      );
      message.success('Cập nhật dịch vụ thành công');
    } else {
      const newService = {
        service_id: Date.now(), // fake id
        ...values,
      };
      setServices(prev => [...prev, newService]);
      message.success('Thêm dịch vụ thành công');
    }

    setIsModalOpen(false);
    setEditingService(null);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'service_id',
      key: 'service_id',
      width: 80,
    },
    {
      title: 'Tên dịch vụ',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: value =>
        `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} VNĐ`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 120,
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
            title="Xóa dịch vụ"
            description={`Bạn có chắc muốn xóa "${record.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.service_id)}
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
      title="Quản lý dịch vụ"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Thêm dịch vụ
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo tên dịch vụ..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
      </Space>

      <Table
        rowKey="service_id"
        columns={columns}
        dataSource={filteredServices}
        pagination={{ pageSize: 5 }}
      />

      <ServiceForm
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingService(null);
        }}
        onSubmit={handleSubmitForm}
        initialValues={editingService}
        isEditing={!!editingService}
      />
    </Card>
  );
};

export default Services;
