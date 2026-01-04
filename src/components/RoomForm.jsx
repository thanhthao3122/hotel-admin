// src/components/RoomForm.jsx
import {
  Form,
  Input,
  Modal,
  Select,
  Upload,
  Button,
  Divider,
  Switch,
  message as antMessage,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

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

      if (initialValues?.bed_style) {
        const desc = initialValues.bed_style.toLowerCase();

        // Simple parsing logic (can be improved)
        const singleMatch = desc.match(/(\d+)\s*giường đơn/);
        if (singleMatch) bedSingle = parseInt(singleMatch[1]);

        const doubleMatch = desc.match(/(\d+)\s*giường đôi/);
        if (doubleMatch) bedDouble = parseInt(doubleMatch[1]);

        const kingMatch = desc.match(/(\d+)\s*giường king/);
        if (kingMatch) bedKing = parseInt(kingMatch[1]);

        // If it doesn't match standard patterns, put in custom
        if (!singleMatch && !doubleMatch && !kingMatch) {
          customBed = initialValues.bed_style;
        }
      }

      form.setFieldsValue(
        initialValues || {
          room_number: "",
          room_type_id: roomTypes?.[0]?.room_type_id || undefined,
          status: "available",
          bed_style: "",
          is_active: "",
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
      // Construct bed_style from counters if not custom
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
      formData.append("room_number", values.room_number);
      formData.append("room_type_id", values.room_type_id);
      formData.append("status", values.status);
      formData.append("bed_style", values.bed_style);
      formData.append("is_active", values.is_active ? 1 : 0);

      if (fileList.length > 0) {
        formData.append("image", fileList[0].originFileObj);
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
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      antMessage.error("Chỉ được upload file ảnh!");
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      antMessage.error("Ảnh phải nhỏ hơn 5MB!");
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
      width={560} //RỘNG HƠN
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
        {isEditing && (
          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select>
              <Select.Option value="available">Trống</Select.Option>
              <Select.Option value="booked">Đã đặt</Select.Option>
              <Select.Option value="occupied">Đang ở</Select.Option>
              <Select.Option value="cleaning">Đang dọn</Select.Option>
              <Select.Option value="maintenance">Bảo trì</Select.Option>
            </Select>
          </Form.Item>
        )}

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
          <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
            Hỗ trợ: JPG, PNG, GIF, WebP, AVIF (Max 5MB)
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div style={{ marginTop: 16 }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 300,
                  borderRadius: 8,
                  border: "1px solid #d9d9d9",
                }}
              />
            </div>
          )}
        </Form.Item>
        <Form.Item
          label="Kiểu giường"
          name="bed_style"
          rules={[{ required: true, message: "Vui lòng nhập kiểu giường" }]}
        >
          <Input placeholder="VD: 1 Giường đơn / 2 Giường đôi / 1 Giường King" />
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

export default RoomForm;
