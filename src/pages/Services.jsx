// src/pages/Services.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Space,
  Table,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import ServiceForm from '../components/ServiceForm.jsx';
import serviceApi from '../api/serviceApi.js';

const Services = () => {
  const [services, setServices] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  const fetchServices = async (
    page = pagination.current,
    limit = pagination.pageSize
  ) => {
    try {
      setLoading(true);
      const res = await serviceApi.getAll(page, limit);
      // Giả định backend trả: { success, data, pagination }
      setServices(res.data || []);
      if (res.pagination) {
        setPagination({
          current: res.pagination.page,
          pageSize: res.pagination.limit,
          total: res.pagination.total,
        });
      } else {
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: limit,
          total: (res.data || []).length,
        }));
      }
    } catch (error) {
      console.error(error);
      message.error('Không tải được danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(1, pagination.pageSize);
  }, []);

  const filteredServices = useMemo(() => {
    const keyword = searchText.toLowerCase();
    return services.filter((s) =>
      s.name.toLowerCase().includes(keyword)
    );
  }, [services, searchText]);

  const openCreateModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await serviceApi.delete(id);
      message.success('Đã xóa dịch vụ');
      fetchServices();
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Không xóa được dịch vụ';
      message.error(msg);
    }
  };

  const handleSubmitForm = async (values) => {
    try {
      if (editingService) {
        await serviceApi.update(editingService.service_id, values);
        message.success('Cập nhật dịch vụ thành công');
      } else {
        await serviceApi.create(values);
        message.success('Thêm dịch vụ thành công');
      }
      setIsModalOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Có lỗi khi lưu dịch vụ';
      message.error(msg);
    }
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
      render: (value) =>
        `${Number(value)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, '.')} VNĐ`,
      sorter: (a, b) => Number(a.price) - Number(b.price),
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
            <Button size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pager) => {
    const { current, pageSize } = pager;
    setPagination((prev) => ({
      ...prev,
      current,
      pageSize,
    }));
    fetchServices(current, pageSize);
  };

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
      {/* Search */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo tên dịch vụ..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
      </Space>

      {/* Table */}
      <Table
        rowKey="service_id"
        columns={columns}
        dataSource={filteredServices}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20'],
        }}
        onChange={handleTableChange}
      />

      {/* Modal Thêm/Sửa */}
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
