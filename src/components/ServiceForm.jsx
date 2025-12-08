// src/components/ServiceForm.jsx
import { Form, Input, InputNumber, Modal, Select } from "antd";
import { useEffect } from "react";

const { Option } = Select;

const ServiceForm = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  isEditing,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          name: initialValues.name,
          price: Number(initialValues.price),
          unit: initialValues.unit,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (err) {
      // ignore
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEditing ? "Cập nhật" : "Thêm mới"}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên dịch vụ"
          name="name"
          rules={[{ required: true, message: "Nhập tên dịch vụ" }]}
        >
          <Input placeholder="Ví dụ: Giặt ủi, Ăn sáng..." />
        </Form.Item>

        <Form.Item
          label="Đơn giá (VNĐ)"
          name="price"
          rules={[{ required: true, message: "Nhập đơn giá" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            step={1000}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
            parser={(v) => v.replace(/\./g, "")}
          />
        </Form.Item>

        <Form.Item label="Đơn vị tính" name="unit">
          {/* Có thể cho chọn sẵn hoặc cho nhập tự do */}
          <Select placeholder="Chọn đơn vị" allowClear>
            <Option value="lần">lần</Option>
            <Option value="ngày">ngày</Option>
            <Option value="bộ">bộ</Option>
            <Option value="kg">kg</Option>
            <Option value="suất">suất</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ServiceForm;
