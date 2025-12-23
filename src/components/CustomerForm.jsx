// src/components/CustomerForm.jsx
import { Form, Input, Modal } from "antd";
import { useEffect } from "react";

const CustomerForm = ({ open, onCancel, onSubmit, initialValues, isEditing }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValues || {
          full_name: "",
          phone: "",
          email: "",
          id_card: "",

        }
      );
    }
  }, [open, initialValues, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onSubmit(values);
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
      title={isEditing ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnClose
      okText={isEditing ? "Lưu" : "Thêm"}
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Họ và tên"
          name="full_name"
          rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
        >
          <Input placeholder="VD: Nguyễn Văn A" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại" },
            {
              pattern: /^0\d{9}$/,
              message: "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)",
            },
          ]}
        >
          <Input placeholder="VD: 0987654321" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: false },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input placeholder="VD: ten@example.com (không bắt buộc)" />
        </Form.Item>

        <Form.Item
          label="CCCD"
          name="id_card"
          rules={[
            { required: false, message: "Vui lòng nhập CCCD" },
            {
              pattern: /^\d{12}$/,
              message: "CCCD phải có 12 số",
            },
          ]}
        >
          <Input placeholder="VD: 012345678901" />
        </Form.Item>


      </Form>
    </Modal>
  );
};

export default CustomerForm;
