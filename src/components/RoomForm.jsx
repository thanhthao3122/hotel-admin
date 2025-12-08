import { Form, Input, Modal, Select, Button, Upload, Divider } from "antd";
import { useEffect } from "react";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;
const IMAGE_BASE_URL = "http://localhost:5000/uploads/rooms";

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
    if (!open) return;

    if (initialValues) {
      const fileList = initialValues.image
        ? [
            {
              uid: "-1",
              name: initialValues.image,
              status: "done",
              url: `${IMAGE_BASE_URL}/${initialValues.image}`,
            },
          ]
        : [];

      form.setFieldsValue({
        room_number: initialValues.room_number,
        room_type_id: initialValues.room_type_id,
        status: initialValues.status,
        image: fileList,
      });
    } else {
      form.setFieldsValue({
        room_number: "",
        room_type_id: roomTypes?.[0]?.room_type_id,
        status: "available",
        image: [],
      });
    }
  }, [open, initialValues, form, roomTypes]);

  const normFile = (e) => (Array.isArray(e) ? e : e?.fileList);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
      form.resetFields();
    });
  };

  return (
    <Modal
      title={isEditing ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={isEditing ? "Lưu" : "Thêm"}
      cancelText="Hủy"
      width={560}                // ✅ RỘNG HƠN
      destroyOnClose
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

        <Divider orientation="left">Hình ảnh phòng</Divider>

        <Form.Item
          name="image"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload
            beforeUpload={() => false}
            maxCount={1}
            listType="picture-card"   //  QUAN TRỌNG
          >
            <UploadOutlined />
            <div>Chọn ảnh</div>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoomForm;
