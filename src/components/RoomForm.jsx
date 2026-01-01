// src/components/RoomForm.jsx
import { Form, Input, Modal, Select, Upload, Button, Divider, Row, Col, InputNumber, message as antMessage } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

const { Option } = Select;
const IMAGE_BASE_URL = "http://localhost:5000";

const RoomForm = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  isEditing,
  roomTypes,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (open) {
      // Logic to parse bed description if editing
      let bedSingle = 0;
      let bedDouble = 0;
      let bedKing = 0;
      let customBed = '';

      if (initialValues?.beds_description) {
        const desc = initialValues.beds_description.toLowerCase();

        // Simple parsing logic (can be improved)
        const singleMatch = desc.match(/(\d+)\s*giường đơn/);
        if (singleMatch) bedSingle = parseInt(singleMatch[1]);

        const doubleMatch = desc.match(/(\d+)\s*giường đôi/);
        if (doubleMatch) bedDouble = parseInt(doubleMatch[1]);

        const kingMatch = desc.match(/(\d+)\s*giường king/);
        if (kingMatch) bedKing = parseInt(kingMatch[1]);

        // If it doesn't match standard patterns, put in custom
        if (!singleMatch && !doubleMatch && !kingMatch) {
          customBed = initialValues.beds_description;
        }
      }

      form.setFieldsValue(
        initialValues || {
          room_number: '',
          room_type_id: roomTypes?.[0]?.room_type_id || undefined,
          status: 'available',
          beds_description: '',
          bed_single: bedSingle,
          bed_double: bedDouble,
          bed_king: bedKing,
          custom_bed: customBed
        }
      );

      // Handle image preview
      if (initialValues?.image) {
        const imgPath = initialValues.image;
        const fullUrl = imgPath.startsWith("http")
          ? imgPath
          : `${IMAGE_BASE_URL}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
        setImagePreview(fullUrl);
      } else {
        setImagePreview(null);
      }
      setFileList([]);
    }
  }, [open, initialValues, form, roomTypes]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      // Construct beds_description from counters if not custom
      let finalBeds = values.custom_bed || '';
      if (!finalBeds) {
        const parts = [];
        if (values.bed_single > 0) parts.push(`${values.bed_single} Giường đơn`);
        if (values.bed_double > 0) parts.push(`${values.bed_double} Giường đôi`);
        if (values.bed_king > 0) parts.push(`${values.bed_king} Giường King`);
        finalBeds = parts.join(', ');
      }

      // Tạo FormData để upload file
      const formData = new FormData();
      formData.append('room_number', values.room_number);
      formData.append('room_type_id', values.room_type_id);
      formData.append('status', values.status);
      formData.append('beds_description', finalBeds);

      if (fileList.length > 0) {
        formData.append('image', fileList[0].originFileObj);
      }

      onSubmit(formData);
      form.resetFields();
      setFileList([]);
      setImagePreview(null);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setImagePreview(null);
    onCancel();
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    const latestFile = newFileList.slice(-1);
    setFileList(latestFile);
    if (latestFile.length > 0) {
      const file = latestFile[latestFile.length - 1].originFileObj;
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      antMessage.error('Chỉ được upload file ảnh!');
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      antMessage.error('Ảnh phải nhỏ hơn 5MB!');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  return (
    <Modal
      title={isEditing ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={isEditing ? "Lưu" : "Thêm"}
      cancelText="Hủy"
      width={600}
    >
      <Form form={form} layout="vertical">
        <Divider orientation="left">Thông tin cơ bản</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Số phòng"
              name="room_number"
              rules={[{ required: true, message: "Vui lòng nhập số phòng" }]}
            >
              <Input placeholder="VD: 101, 202..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Loại phòng"
              name="room_type_id"
              rules={[{ required: true, message: "Vui lòng chọn loại phòng" }]}
            >
              <Select placeholder="Chọn loại phòng">
                {roomTypes?.map((rt) => (
                  <Option key={rt.room_type_id} value={rt.room_type_id}>
                    {rt.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Cấu hình giường</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Giường đơn" name="bed_single">
              <InputNumber min={0} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Giường đôi" name="bed_double">
              <InputNumber min={0} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Giường King" name="bed_king">
              <InputNumber min={0} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Mô tả khác (tùy chọn)"
          name="custom_bed"
          tooltip="Nếu nhập ô này, các lựa chọn bên trên sẽ bị bỏ qua"
        >
          <Input placeholder="Nhập mô tả khác nếu cần..." />
        </Form.Item>

        <Divider orientation="left">Trạng thái & Hình ảnh</Divider>
        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
        >
          <Select>
            <Option value="available">Trống</Option>
            <Option value="booked">Đã đặt</Option>
            <Option value="occupied">Đang ở</Option>
            <Option value="cleaning">Đang dọn</Option>
            <Option value="maintenance">Bảo trì</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Hình ảnh phòng">
          <Upload
            listType="picture"
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={beforeUpload}
            maxCount={1}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
          {imagePreview && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
            </div>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoomForm;
