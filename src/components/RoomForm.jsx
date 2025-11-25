// src/components/RoomForm.jsx
import { Form, Input, InputNumber, Modal, Select } from 'antd';
import { useEffect } from 'react';

const { Option } = Select;

const RoomForm = ({ open, onCancel, onSubmit, initialValues, isEditing, roomTypes }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        initialValues || {
          room_number: '',
          floor: 1,
          room_type_id: roomTypes?.[0]?.room_type_id || null,
          status: 'AVAILABLE',
        }
      );
    }
  }, [open, initialValues, form, roomTypes]);

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
      title={isEditing ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnClose
      okText={isEditing ? 'Lưu' : 'Thêm'}
      cancelText="Hủy"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          floor: 1,
          status: 'AVAILABLE',
        }}
      >
        <Form.Item
          label="Số phòng"
          name="room_number"
          rules={[{ required: true, message: 'Vui lòng nhập số phòng' }]}
        >
          <Input placeholder="VD: 101, 202..." />
        </Form.Item>

        <Form.Item
          label="Tầng"
          name="floor"
          rules={[{ required: true, message: 'Vui lòng nhập tầng' }]}
        >
          <InputNumber min={1} max={100} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Loại phòng"
          name="room_type_id"
          rules={[{ required: true, message: 'Vui lòng chọn loại phòng' }]}
        >
          <Select placeholder="Chọn loại phòng">
            {roomTypes?.map(rt => (
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
            <Option value="AVAILABLE">Trống</Option>
            <Option value="BOOKED">Đã đặt</Option>
            <Option value="OCCUPIED">Đang ở</Option>
            <Option value="CLEANING">Đang dọn</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoomForm;
