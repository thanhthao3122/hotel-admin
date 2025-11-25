import { Form, Input, InputNumber, Modal } from 'antd';
import { useEffect } from 'react';

const ServiceForm = ({ open, onCancel, onSubmit, initialValues, isEditing }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValues || {
          name: '',
          price: 0,
          unit: '',
        }
      );
    }
  }, [open, initialValues, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then(values => {
        onSubmit(values);
        form.resetFields();
      })
      .catch(err => console.log(err));
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={isEditing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnClose
      okText={isEditing ? 'Lưu' : 'Thêm'}
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên dịch vụ"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}
        >
          <Input placeholder="VD: Ăn sáng Buffet" />
        </Form.Item>

        <Form.Item
          label="Giá (VNĐ)"
          name="price"
          rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
        >
          <InputNumber
            min={0}
            step={10000}
            style={{ width: '100%' }}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            parser={v => v.replace(/\./g, '')}
          />
        </Form.Item>

        <Form.Item
          label="Đơn vị tính"
          name="unit"
          rules={[{ required: true, message: 'Vui lòng nhập đơn vị tính' }]}
        >
          <Input placeholder="VD: suất, kg, lượt, chuyến..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ServiceForm;
