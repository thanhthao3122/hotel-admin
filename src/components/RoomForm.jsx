
// src/components/RoomForm.jsx
import { Form, Input, Modal, Select, Upload, Button, Divider, message as antMessage } from 'antd';
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
      form.setFieldsValue(
        initialValues || {
          room_number: '',
          room_type_id: roomTypes?.[0]?.room_type_id || undefined,
          status: 'available',
        }
      );

      // Set preview if editing with existing image
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

  const normFile = (e) => (Array.isArray(e) ? e : e?.fileList);

  const handleOk = () => {
    form.validateFields().then((values) => {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('room_number', values.room_number);
      formData.append('room_type_id', values.room_type_id);
      formData.append('status', values.status);

      // Add image file if selected
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
    // Only keep the last file
    const latestFile = newFileList.slice(-1);
    setFileList(latestFile);

    // Create preview
    if (latestFile.length > 0) {
      const file = latestFile[0].originFileObj;
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
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

    return false; // Prevent auto upload
  };


  return (
    <Modal
      title={isEditing ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={isEditing ? "Lưu" : "Thêm"}
      cancelText="Hủy"
      width={560}                //RỘNG HƠN

    >
      <Form form={form} layout="vertical">
        <Divider orientation="left">Thông tin phòng</Divider>

        <Form.Item
          label="Số phòng"
          name="room_number"
          rules={[{ required: true, message: "Vui lòng nhập số phòng" }]}
        >
          <Input placeholder="VD: 101, 202..." />
        </Form.Item>

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

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}>
        
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
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif"
          >
            <Button icon={<UploadOutlined />}>Chọn ảnh từ máy tính</Button>
          </Upload>
          <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
            Hỗ trợ: JPG, PNG, GIF, WebP, AVIF (Max 5MB)
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div style={{ marginTop: 16 }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 8,
                  border: '1px solid #d9d9d9'
                }}
              />
            </div>
          )}

        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoomForm;
