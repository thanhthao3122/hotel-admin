// src/components/RoomForm.jsx
import { Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';

const { Option } = Select;

const RoomForm = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  isEditing,
  roomTypes,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValues || {
          room_number: '',
          room_type_id: roomTypes?.[0]?.room_type_id || undefined,
          status: 'available',
          image: '',
        }
      );
    }
  }, [open, initialValues, form, roomTypes]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={isEditing ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={isEditing ? 'Lưu' : 'Thêm'}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Số phòng"
          name="room_number"
          rules={[{ required: true, message: 'Vui lòng nhập số phòng' }]}
        >
          <Input placeholder="VD: 101, 202..." />
        </Form.Item>

        <Form.Item
          label="Loại phòng"
          name="room_type_id"
          rules={[{ required: true, message: 'Vui lòng chọn loại phòng' }]}
        >
          <Select placeholder="Chọn loại phòng">
            {roomTypes?.map((rt) => (
              <Option key={rt.room_type_id} value={rt.room_type_id}>
                {rt.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
        >
          <Select>
            <Option value="available">Trống</Option>
            <Option value="booked">Đã đặt</Option>
            <Option value="occupied">Đang ở</Option>
            <Option value="cleaning">Đang dọn</Option>
            <Option value="maintenance">Bảo trì</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Hình ảnh (URL)" name="image">
          <Input placeholder="Link hình ảnh (không bắt buộc)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoomForm;
