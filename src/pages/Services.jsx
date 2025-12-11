// src/pages/Services.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import serviceApi from "../api/serviceApi";
import ServiceForm from "../components/ServiceForm.jsx";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ====== LOAD DỮ LIỆU TỪ API ======
  const fetchServices = async (
    page = pagination.current,
    limit = pagination.pageSize
  ) => {
    try {
      setLoading(true);
      const res = await serviceApi.getAll(page, limit);
      const list = res.data || [];
      const pag = res.pagination;

      setServices(list);

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
      message.error("Không tải được danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== FILTER THEO TÊN ======
  const filteredServices = useMemo(() => {
    const keyword = searchText.toLowerCase();
    return services.filter((s) => s.name?.toLowerCase().includes(keyword));
  }, [services, searchText]);

  // ====== CRUD ======
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
      message.success("Đã xóa dịch vụ");
      fetchServices();
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Không xóa được dịch vụ";
      message.error(msg);
    }
  };

  const handleSubmitForm = async (values) => {
    try {
      console.log("Submitting service form values:", values);
      if (editingService) {
        await serviceApi.update(editingService.service_id, values);
        message.success("Cập nhật dịch vụ thành công");
      } else {
        await serviceApi.create(values);
        message.success("Thêm dịch vụ thành công");
      }

      setIsModalOpen(false);
      setEditingService(null);
      fetchServices(1, pagination.pageSize);
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Có lỗi khi lưu dịch vụ";
      message.error(msg);
    }
  };

  const handleTableChange = (pager) => {
    const { current, pageSize } = pager;
    setPagination((prev) => ({
      ...prev,
      current,
      pageSize,
    }));
    fetchServices(current, pageSize);
  };

  // ====== CỘT BẢNG ======
  const columns = [
    {
      title: "Tên dịch vụ",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      render: (value) => (
        <Tag color="red">{Number(value).toLocaleString("vi-VN")} VNĐ</Tag>
      ),
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unit",
      key: "unit",
      render: (v) => v || "-",
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      render: (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        });
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
            onClick={() => openEditModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa dịch vụ"
            description={`Bạn có chắc muốn xóa dịch vụ "${record.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.service_id)}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: "#ff4d4f",
                color: "#fff",
                borderColor: "#ff4d4f",
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
      {/* Ô tìm kiếm */}
      <Input
        placeholder="Tìm theo tên dịch vụ..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        allowClear
        style={{ width: 260, marginBottom: 16 }}
      />

      {/* Bảng dịch vụ */}
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
          pageSizeOptions: ["5", "10", "20"],
        }}
        onChange={handleTableChange}
      />

      {/* Modal thêm / sửa */}
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
