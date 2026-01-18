import {
  Form,
  Select,
  Input,
  DatePicker,
  Modal,
  Tag,
  Row,
  Col,
  Typography,
  Space,
} from "antd";
import { useEffect, useState, useCallback, useRef } from "react";
import dayjs from "dayjs";
import voucherApi from "../api/voucherApi";

const { Text } = Typography;
const { Option } = Select;

const BookingForm = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  customers,
  rooms,
  roomTypes,
  isEditing,
}) => {
  const [form] = Form.useForm();

  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [finalTotal, setFinalTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // dùng để tránh vòng lặp onValuesChange khi ta setFieldValue trong code
  const internalUpdateRef = useRef(false);

  const fetchVouchers = useCallback(async () => {
    try {
      const res = await voucherApi.getAll({ active: true });
      if (res && res.data) setVouchers(res.data);
    } catch (error) {
      console.error("Failed to fetch vouchers", error);
    }
  }, []);

  // ✅ Tính tiền: nhận trực tiếp values (KHÔNG dùng getFieldsValue ngay lúc DatePicker change)
  const calculateFinalPrice = useCallback(
    (values) => {
      const { room_ids, room_overrides, check_in, check_out } = values || {};

      if (!room_ids || room_ids.length === 0) {
        setFinalTotal(0);
        return;
      }

      let totalBaseSum = 0;

      room_ids.forEach((id) => {
        const room = rooms.find((r) => r.room_id === id);
        if (!room) return;

        const roomType = roomTypes.find(
          (rt) => rt.room_type_id === room.room_type_id
        );
        if (!roomType) return;

        const override = room_overrides?.[id];

        // ✅ RULE CHUẨN:
        // - Nếu override đủ 2 ngày -> dùng override
        // - Nếu override thiếu -> dùng master
        const hasFullOverride = !!(override?.check_in && override?.check_out);
        const finalCin = hasFullOverride ? override.check_in : check_in;
        const finalCout = hasFullOverride ? override.check_out : check_out;

        if (finalCin && finalCout) {
          const nights = dayjs(finalCout)
            .startOf("day")
            .diff(dayjs(finalCin).startOf("day"), "day");

          if (nights > 0) {
            totalBaseSum += Number(roomType.base_price || 0) * nights;
          }
        }
      });

      if (totalBaseSum <= 0) {
        setFinalTotal(0);
        return;
      }

      let totalWithVoucher = totalBaseSum;

      if (selectedVoucher) {
        const discountValue = parseFloat(selectedVoucher.discount_value || 0);

        if (selectedVoucher.discount_type === "percentage") {
          totalWithVoucher -= totalBaseSum * (discountValue / 100);
        } else if (selectedVoucher.discount_type === "fixed") {
          totalWithVoucher = Math.max(0, totalBaseSum - discountValue);
        }
      }

      setFinalTotal(totalWithVoucher);
    },
    [rooms, roomTypes, selectedVoucher]
  );

  // ✅ Helper: sync overrides theo master cho các phòng CHƯA custom
  const syncOverridesWithMaster = useCallback((allValues) => {
    const ids = allValues.room_ids || [];
    const overrides = allValues.room_overrides || {};
    const cin = allValues.check_in;
    const cout = allValues.check_out;

    const next = { ...overrides };

    ids.forEach((id) => {
      const ov = next[id];
      // phòng chưa có override hoặc custom=false -> ăn theo master
      if (!ov || ov.custom === false) {
        next[id] = {
          ...(ov || {}),
          check_in: cin,
          check_out: cout,
          custom: false,
        };
      }
    });

    // xoá override của phòng không còn chọn
    Object.keys(next).forEach((k) => {
      const rid = Number(k);
      if (!ids.includes(rid)) delete next[k];
    });

    return next;
  }, []);

  // ✅ Helper: sync master date theo min/max của các phòng
  const syncMasterWithOverrides = useCallback((allValues) => {
    const overrides = allValues.room_overrides || {};
    const ids = allValues.room_ids || [];

    if (ids.length === 0) return { cin: null, cout: null };

    let minCin = null;
    let maxCout = null;

    ids.forEach((id) => {
      const ov = overrides[id];
      if (ov && ov.check_in && ov.check_out) {
        if (!minCin || dayjs(ov.check_in).isBefore(minCin)) {
          minCin = dayjs(ov.check_in);
        }
        if (!maxCout || dayjs(ov.check_out).isAfter(maxCout)) {
          maxCout = dayjs(ov.check_out);
        }
      }
    });

    return { cin: minCin, cout: maxCout };
  }, []);

  // ✅ Khi mở modal: set values + tạo override chuẩn cho từng phòng
  useEffect(() => {
    if (!open) return;

    fetchVouchers();

    if (initialValues) {
      const roomIds =
        initialValues.room_ids ||
        (initialValues.rooms ? initialValues.rooms.map((r) => r.room_id) : []);

      if (initialValues.room_id && !roomIds.includes(initialValues.room_id)) {
        roomIds.push(initialValues.room_id);
      }

      const masterCin = initialValues.checkin_date
        ? dayjs(initialValues.checkin_date)
        : dayjs();
      const masterCout = initialValues.checkout_date
        ? dayjs(initialValues.checkout_date)
        : dayjs().add(1, "day");

      // overrides: mỗi phòng luôn có override đầy đủ; nếu lấy từ pivot thì custom=true
      const overrides = {};

      // 1) tạo default override cho tất cả phòng đang chọn (custom=false)
      roomIds.forEach((rid) => {
        overrides[rid] = {
          check_in: masterCin,
          check_out: masterCout,
          custom: false,
        };
      });

      // 2) nếu backend trả ngày theo phòng (pivot), override sẽ là custom=true
      if (initialValues.rooms && Array.isArray(initialValues.rooms)) {
        initialValues.rooms.forEach((r) => {
          const pivot = r.BookingRoom || r.booking_room || r;
          const cin = pivot.checkin_date || r.checkin_date;
          const cout = pivot.checkout_date || r.checkout_date;

          if (r.room_id && cin && cout) {
            overrides[r.room_id] = {
              check_in: dayjs(cin),
              check_out: dayjs(cout),
              custom: true,
            };
          }
        });
      }

      const valuesToSet = {
        ...initialValues,
        room_ids: roomIds,
        room_overrides: overrides,
        payment_method: initialValues.payment_method || "pay_later",
        source: initialValues.source || "admin",
        check_in: masterCin,
        check_out: masterCout,
      };

      internalUpdateRef.current = true;
      form.setFieldsValue(valuesToSet);
      internalUpdateRef.current = false;

      if (initialValues.voucher) {
        setSelectedVoucher(initialValues.voucher);
      } else {
        setSelectedVoucher(null);
      }

      calculateFinalPrice(valuesToSet);
    } else {
      form.resetFields();

      const defaultValues = {
        payment_method: "pay_later",
        source: "admin",
        check_in: dayjs(),
        check_out: dayjs().add(1, "day"),
        room_ids: [],
        room_overrides: {},
      };

      internalUpdateRef.current = true;
      form.setFieldsValue(defaultValues);
      internalUpdateRef.current = false;

      setSelectedVoucher(null);
      setFinalTotal(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues, form, fetchVouchers]);

  // ✅ Sync voucher từ voucher_id sau khi vouchers load (edit)
  useEffect(() => {
    if (!open || !initialValues?.voucher_id) return;
    if (selectedVoucher) return;
    if (vouchers.length === 0) return;

    const found = vouchers.find(
      (v) => v.voucher_id === initialValues.voucher_id
    );
    if (found) setSelectedVoucher(found);
  }, [open, initialValues, vouchers, selectedVoucher]);

  // ✅ Khi đổi voucher -> tính lại
  useEffect(() => {
    if (!open) return;
    const current = form.getFieldsValue(true);
    calculateFinalPrice(current);
  }, [selectedVoucher, open, form, calculateFinalPrice]);

  // ✅ onValuesChange: nguồn chân lý để tính tiền (allValues mới nhất)
  const handleValuesChange = (changed, all) => {
    if (internalUpdateRef.current) return;

    // 1) đổi master date -> sync override cho phòng chưa custom
    if (changed.check_in || changed.check_out) {
      const nextOverrides = syncOverridesWithMaster(all);

      internalUpdateRef.current = true;
      form.setFieldValue("room_overrides", nextOverrides);
      internalUpdateRef.current = false;

      calculateFinalPrice({ ...all, room_overrides: nextOverrides });
      return;
    }

    // 2) đổi room_ids -> đảm bảo overrides có đủ + xoá phòng bỏ chọn
    if (changed.room_ids) {
      const nextOverrides = syncOverridesWithMaster(all);

      internalUpdateRef.current = true;
      form.setFieldValue("room_overrides", nextOverrides);
      internalUpdateRef.current = false;

      calculateFinalPrice({ ...all, room_overrides: nextOverrides });
      return;
    }

    // 3) đổi override -> tự động sync master date rộng nhất
    if (changed.room_overrides) {
      const { cin, cout } = syncMasterWithOverrides(all);

      if (cin || cout) {
        internalUpdateRef.current = true;
        if (cin) form.setFieldValue("check_in", cin);
        if (cout) form.setFieldValue("check_out", cout);
        internalUpdateRef.current = false;
      }

      calculateFinalPrice(all);
      return;
    }

    // các thay đổi khác: nếu cần thì tính (thường không cần)
  };

  const handleVoucherSelect = (code) => {
    const voucher = vouchers.find((v) => v.code === code);
    setSelectedVoucher(voucher || null);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const {
        room_ids,
        room_overrides,
        check_in,
        check_out,
        user_id,
        payment_method,
        source,
      } = values;

      const roomsPayload = (room_ids || []).map((id) => {
        const override = room_overrides?.[id];
        const hasFullOverride = !!(override?.check_in && override?.check_out);

        const finalCin = hasFullOverride ? override.check_in : check_in;
        const finalCout = hasFullOverride ? override.check_out : check_out;

        const room = rooms.find((r) => r.room_id === id);
        const rt =
          room?.roomType ||
          roomTypes.find((t) => t.room_type_id === room?.room_type_id);

        return {
          room_id: id,
          checkin_date: finalCin.format("YYYY-MM-DD"),
          checkout_date: finalCout.format("YYYY-MM-DD"),
          price_per_night: rt?.base_price || 0,
        };
      });

      await onSubmit({
        user_id,
        checkin_date: check_in.format("YYYY-MM-DD"),
        checkout_date: check_out.format("YYYY-MM-DD"),
        rooms: roomsPayload,
        source: source || "admin",
        payment_method: payment_method || "pay_later",
        voucher_code: selectedVoucher ? selectedVoucher.code : null,
      });

      form.resetFields();
    } catch (error) {
      console.error("Validation or submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEditing ? "Cập nhật đơn đặt phòng" : "Thông tin đặt phòng mới"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={submitting}
      width={700}
      okText={isEditing ? "Cập nhật" : "Xác nhận đặt"}
      cancelText="Đóng"
      destroyOnClose
    >
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <Form.Item
          label="Khách hàng"
          name="user_id"
          rules={[{ required: true, message: "Chọn khách hàng" }]}
        >
          <Select placeholder="Chọn khách hàng">
            {customers.map((c) => (
              <Option value={c.user_id} key={c.user_id}>
                {c.full_name} - {c.phone}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="payment_method" hidden>
          <Input />
        </Form.Item>

        <Form.Item name="source" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          label="Phòng"
          name="room_ids"
          rules={[{ required: true, message: "Chọn ít nhất 1 phòng" }]}
        >
          <Select mode="multiple" placeholder="Chọn các phòng">
            {rooms
              .filter(
                (r) =>
                  r.status === "available" ||
                  (initialValues?.rooms &&
                    initialValues.rooms.some((br) => br.room_id === r.room_id))
              )
              .map((r) => (
                <Option key={r.room_id} value={r.room_id}>
                  Phòng {r.room_number} ({r.roomType?.name})
                </Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Chọn ngày nhận phòng"
          name="check_in"
          rules={[{ required: true, message: "Vui lòng chọn ngày nhận phòng" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            placeholder="Ngày nhận phòng"
            disabledDate={(current) =>
              current && current < dayjs().startOf("day")
            }
          />
        </Form.Item>

        <Form.Item
          label="Chọn ngày trả phòng"
          name="check_out"
          rules={[{ required: true, message: "Vui lòng chọn ngày trả phòng" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            placeholder="Ngày trả phòng"
            disabledDate={(current) => {
              const cin = form.getFieldValue("check_in");
              return (
                current &&
                (cin
                  ? current <= cin.endOf("day")
                  : current < dayjs().endOf("day"))
              );
            }}
          />
        </Form.Item>

        {/* Tùy chỉnh ngày cho từng phòng */}
        <Form.Item
          shouldUpdate={(prev, curr) => prev.room_ids !== curr.room_ids}
        >
          {({ getFieldValue }) => {
            const selectedIds = getFieldValue("room_ids") || [];
            if (selectedIds.length <= 1) return null;

            return (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: "#fafafa",
                  borderRadius: 8,
                  border: "1px solid #f0f0f0",
                }}
              >
                <Typography.Title level={5}>
                  Tùy chỉnh ngày theo phòng (Nếu có)
                </Typography.Title>

                {selectedIds.map((id) => {
                  const room = rooms.find((r) => r.room_id === id);

                  return (
                    <div
                      key={id}
                      style={{
                        marginBottom: 12,
                        paddingBottom: 12,
                        borderBottom: "1px dashed #e8e8e8",
                      }}
                    >
                      <Row justify="space-between" align="middle">
                        <Text strong>Phòng {room?.room_number}</Text>
                      </Row>

                      <Row gutter={8}>
                        <Col span={12}>
                          <Form.Item
                            name={["room_overrides", id, "check_in"]}
                            style={{ marginBottom: 0 }}
                            label="Nhận"
                            rules={[
                              {
                                required: true,
                                message: "Chọn ngày nhận",
                              },
                            ]}
                          >
                            <DatePicker
                              size="small"
                              style={{ width: "100%" }}
                              format="DD/MM/YYYY"
                              onChange={(d) => {
                                const currentOverrides =
                                  form.getFieldValue("room_overrides") || {};
                                const nextOverrides = {
                                  ...currentOverrides,
                                  [id]: {
                                    ...(currentOverrides[id] || {}),
                                    check_in: d,
                                    custom: true,
                                  },
                                };

                                internalUpdateRef.current = true;
                                form.setFieldValue(
                                  "room_overrides",
                                  nextOverrides
                                );

                                const allValues = {
                                  ...form.getFieldsValue(true),
                                  room_overrides: nextOverrides,
                                };
                                const { cin, cout } =
                                  syncMasterWithOverrides(allValues);
                                if (cin) form.setFieldValue("check_in", cin);
                                if (cout) form.setFieldValue("check_out", cout);
                                internalUpdateRef.current = false;

                                calculateFinalPrice(form.getFieldsValue(true));
                              }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name={["room_overrides", id, "check_out"]}
                            style={{ marginBottom: 0 }}
                            label="Trả"
                            rules={[
                              {
                                required: true,
                                message: "Chọn ngày trả",
                              },
                            ]}
                          >
                            <DatePicker
                              size="small"
                              style={{ width: "100%" }}
                              format="DD/MM/YYYY"
                              onChange={(d) => {
                                const currentOverrides =
                                  form.getFieldValue("room_overrides") || {};
                                const nextOverrides = {
                                  ...currentOverrides,
                                  [id]: {
                                    ...(currentOverrides[id] || {}),
                                    check_out: d,
                                    custom: true,
                                  },
                                };

                                internalUpdateRef.current = true;
                                form.setFieldValue(
                                  "room_overrides",
                                  nextOverrides
                                );

                                const allValues = {
                                  ...form.getFieldsValue(true),
                                  room_overrides: nextOverrides,
                                };
                                const { cin, cout } =
                                  syncMasterWithOverrides(allValues);
                                if (cin) form.setFieldValue("check_in", cin);
                                if (cout) form.setFieldValue("check_out", cout);
                                internalUpdateRef.current = false;

                                calculateFinalPrice(form.getFieldsValue(true));
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row style={{ marginTop: 8 }}>
                        <Text type="secondary">
                         
                        </Text>
                      </Row>
                    </div>
                  );
                })}
              </div>
            );
          }}
        </Form.Item>

        <Form.Item label="Mã giảm giá (Voucher)">
          <Select
            allowClear
            placeholder="Chọn mã giảm giá"
            onChange={handleVoucherSelect}
            value={selectedVoucher ? selectedVoucher.code : undefined}
          >
            {vouchers.map((v) => (
              <Option key={v.voucher_id} value={v.code}>
                <Space>
                  <Text strong>{v.code}</Text>
                  <Tag color="green">
                    {v.discount_type === "percentage"
                      ? `-${v.discount_value}%`
                      : `-${parseInt(v.discount_value, 10).toLocaleString(
                          "vi-VN"
                        )} VNĐ`}
                  </Tag>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {finalTotal > 0 && (
          <div
            style={{
              marginBottom: 24,
              padding: "12px",
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "6px",
            }}
          >
            <Row justify="space-between" align="middle">
              <Text strong>Tổng cộng (Tạm tính):</Text>
              <Text type="success" strong style={{ fontSize: "18px" }}>
                {parseInt(finalTotal, 10).toLocaleString("vi-VN")} VNĐ
              </Text>
            </Row>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default BookingForm;
