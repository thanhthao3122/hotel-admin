// src/components/RoomTypeForm.jsx
import { Form, Input, InputNumber, Modal, Switch } from "antd";
import { useEffect } from "react";

const RoomTypeForm = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  isEditing,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValues || {
          name: "",
          capacity: 2,
          base_price: 500000,
          description: "",
          is_active: "",
        }
      );
    }
  }, [open, initialValues, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        // Switch trả true/false, convert về 1/0 cho giống DB
        const payload = {
          ...values,
          is_active: values.is_active ? 1 : 0,
        };
        onSubmit(payload);
        form.resetFields();
      })
      .catch((err) => console.log(err));
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={isEditing ? "Chỉnh sửa loại phòng" : "Thêm loại phòng mới"}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnHidden
      okText={isEditing ? "Lưu" : "Thêm"}
      cancelText="Hủy"
      width={620} // ✅ thêm
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          capacity: 2,
          base_price: 500000,
          is_active: 1,
        }}
      >
        <Form.Item
          label="Tên loại phòng"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên loại phòng" }]}
        >
          <Input placeholder="" />
        </Form.Item>

        <Form.Item
          label="Sức chứa (số người)"
          name="capacity"
          rules={[{ required: true, message: "Vui lòng nhập sức chứa" }]}
        >
          <InputNumber min={1} max={10} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Giá cơ bản / đêm (VNĐ)"
          name="base_price"
          rules={[{ required: true, message: "Vui lòng nhập giá" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            step={50000}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
            }
            parser={(value) => value.replace(/\./g, "")}
          />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={3} placeholder="Mô tả thêm (không bắt buộc)" />
        </Form.Item>

        <Form.Item
          label="Trạng thái hiển thị"
          name="is_active"
          valuePropName="checked"
        >
          <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoomTypeForm;
