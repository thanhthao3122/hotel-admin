import { Form, Select, DatePicker, Modal, InputNumber, Tag, Row, Col, Typography, Space } from 'antd';
import { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import voucherApi from '../api/voucherApi';

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
  const [pricePerNight, setPricePerNight] = useState(0);
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [finalTotal, setFinalTotal] = useState(0);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        // Xử lý room_ids
        const roomIds = initialValues.room_ids ||
          (initialValues.rooms ? initialValues.rooms.map(r => r.room_id) : []);

        if (initialValues.room_id && !roomIds.includes(initialValues.room_id)) {
          roomIds.push(initialValues.room_id);
        }

        // Fix: Lấy ngày từ thuộc tính pivot mapping (BookingRoom)
        const overrides = {};
        if (initialValues.rooms && Array.isArray(initialValues.rooms)) {
          initialValues.rooms.forEach(r => {
            // Check flat properties OR pivot properties
            // Sequelize pivot data is often in r.BookingRoom or r.joinTableAttributes depending on alias
            // Based on backend 'through' definition, checking potential locations
            const pivot = r.BookingRoom || r.booking_room || r;
            const cin = pivot.checkin_date || r.checkin_date; // Fallback to r if flattened
            const cout = pivot.checkout_date || r.checkout_date;

            if (cin && cout && r.room_id) {
              overrides[r.room_id] = {
                check_in: dayjs(cin),
                check_out: dayjs(cout)
              };
            }
          });
        }

        form.setFieldsValue({
          ...initialValues,
          room_ids: roomIds,
          room_overrides: overrides,
          payment_method: initialValues.payment_method || 'pay_later',
          check_in: initialValues.checkin_date ? dayjs(initialValues.checkin_date) : dayjs(),
          check_out: initialValues.checkout_date ? dayjs(initialValues.checkout_date) : dayjs().add(1, 'day'),
        });

        // Xử lý Voucher cũ
        if (initialValues.voucher) {
          setSelectedVoucher(initialValues.voucher);
        } else {
          // Reset để useEffect dưới xử lý theo voucher_id
          setSelectedVoucher(null);
        }

        setTimeout(() => {
          calculateFinalPrice();
        }, 100);

      } else {
        form.resetFields();
        form.setFieldsValue({
          payment_method: 'pay_later',
          check_in: dayjs(),
          check_out: dayjs().add(1, 'day'),
        });
        setPricePerNight(0);
        setSelectedVoucher(null);
        setFinalTotal(0);
      }

      fetchVouchers();
    }
  }, [open, initialValues, rooms, roomTypes, form]);

  // Effect riêng để sync Voucher từ voucher_id khi danh sách voucher đã load
  useEffect(() => {
    if (open && initialValues && initialValues.voucher_id && !selectedVoucher && vouchers.length > 0) {
      const found = vouchers.find(v => v.voucher_id === initialValues.voucher_id);
      if (found) {
        setSelectedVoucher(found);
        calculateFinalPrice();
      }
    }
  }, [vouchers, initialValues, open, selectedVoucher]);

  const fetchVouchers = async () => {
    try {
      // Chỉ lấy voucher đang hoạt động
      const res = await voucherApi.getAll({ active: true });
      if (res && res.data) {
        setVouchers(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch vouchers", error);
    }
  };

  // Tính toán lại giá cuối cùng mỗi khi các yếu tố thay đổi
  useEffect(() => {
    calculateFinalPrice();
  }, [pricePerNight, selectedVoucher, form]); // form values change handling requires more care, usually involving form.getFieldsValue() or onValuesChange

  const calculateFinalPrice = () => {
    const values = form.getFieldsValue();
    const { room_ids, room_overrides, check_in, check_out } = values;

    if (!room_ids || room_ids.length === 0) {
      setFinalTotal(0);
      return;
    }

    let totalBaseSum = 0;

    room_ids.forEach(id => {
      const room = rooms.find(r => r.room_id === id);
      if (!room) return;
      const roomType = roomTypes.find(rt => rt.room_type_id === room.room_type_id);
      if (!roomType) return;

      const override = room_overrides?.[id] || {};
      const finalCin = override.check_in || check_in;
      const finalCout = override.check_out || check_out;

      if (finalCin && finalCout) {
        const nights = dayjs(finalCout).diff(dayjs(finalCin), 'day');
        if (nights > 0) {
          totalBaseSum += roomType.base_price * nights;
        }
      }
    });

    if (totalBaseSum === 0) {
      setFinalTotal(0);
      return;
    }

    let totalWithVoucher = totalBaseSum;
    if (selectedVoucher) {
      if (selectedVoucher.discount_type === 'percentage') {
        totalWithVoucher -= totalBaseSum * (parseFloat(selectedVoucher.discount_value) / 100);
      } else if (selectedVoucher.discount_type === 'fixed') {
        // Backend for MULTI ROOM treats fixed voucher as reduction of the TOTAL sum if applied at the end
        // Wait, backend logic for multi room:
        // totalPrice accumulates (base_price * nights)
        // Then subtract voucher from that.
        totalWithVoucher = Math.max(0, totalBaseSum - parseFloat(selectedVoucher.discount_value));
      }
    }

    setFinalTotal(totalWithVoucher);
  };

  const handleValuesChange = (changedValues, allValues) => {
    // Trigger Recalculate if dates change
    if (changedValues.check_in || changedValues.check_out || changedValues.room_overrides || changedValues.room_ids) {
      calculateFinalPrice();
    }

    // Auto-update Master Dates (Min/Max) if Room Overrides change
    if (changedValues.room_overrides) {
      const { room_ids, room_overrides } = allValues;
      if (room_ids && room_ids.length > 0) {
        let minDate = allValues.check_in; // Start with current, but ideally should filter purely from rooms
        let maxDate = allValues.check_out;

        // Better: Re-evaluate from scratch to be rigorous
        const validDates = [];

        room_ids.forEach(rid => {
          // Current logic: If override exists, use it. If not, fallback to... wait.
          // If we fallback to 'master', and 'master' is what we are updating, we have a loop dependency.
          // Ideally: Master is the aggregator. 
          // If a room has specific override, use it.
          // If a room has NO override, it effectively "follows" the master?
          // OR: Does the UI initialize overrides for ALL rooms?
          // 'initialValues' logic initializes overrides if they exist.
          // New rooms selection: 'onChange' in Select initializes newOverrides.

          const override = room_overrides?.[rid];
          if (override?.check_in && override?.check_out) {
            validDates.push({ start: override.check_in, end: override.check_out });
          }
          // If no override, it's technically ambiguous in this context. 
          // But assuming normal flow:
          // 1. User picks Master Date.
          // 2. User picks Room -> Room inherits Master Date.
          // 3. User edits Room Date -> Override created.
          // 4. We calculate Min/Max of (Overrides + Non-Overridden Rooms).
          // Non-overridden rooms should theoretically count as "Master Date".
          // But if we are CHANGING Master Date, those non-overridden rooms move with it.
          // Loops: Room changes -> Master Updates -> Non-overridden rooms "move".
          // This is fine. The invariant is: Master contains All.

          // However, let's strictly look at OVERRIDES to expand the Master.
          // If an override is OUTSIDE current master, expand master.
          // If all overrides are INSIDE, should we shrink? Maybe not, user might want extra buffer?
          // The user request: "tự đông cập nhật min max... để chính xác về vòng đời"
          // This implies strict coupling.
        });

        if (room_overrides) {
          let calculatedMin = null;
          let calculatedMax = null;

          room_ids.forEach(rid => {
            const override = room_overrides[rid];
            // If room has override, rely on it. If not, rely on current form value (which might be the "base").
            // But for "Expansion", we only care if an override pushes boundaries.
            const rIn = override?.check_in || allValues.check_in;
            const rOut = override?.check_out || allValues.check_out;

            if (rIn) {
              if (!calculatedMin || rIn.isBefore(calculatedMin)) calculatedMin = rIn;
            }
            if (rOut) {
              if (!calculatedMax || rOut.isAfter(calculatedMax)) calculatedMax = rOut;
            }
          });

          if (calculatedMin && calculatedMax) {
            if (!calculatedMin.isSame(allValues.check_in) || !calculatedMax.isSame(allValues.check_out)) {
              form.setFieldsValue({
                check_in: calculatedMin,
                check_out: calculatedMax
              });
            }
          }
        }
      }
    }
  };

  const handleRoomSelect = (room_id) => {
    const room = rooms.find(r => r.room_id === room_id);
    if (!room) return;

    const roomType = roomTypes.find(rt => rt.room_type_id === room.room_type_id);
    if (roomType) {
      // Only set single price if it's the first room or simple mode, else logic handled in calc
      setPricePerNight(roomType.base_price);
    }
  };

  const handleVoucherSelect = (code) => {
    const voucher = vouchers.find(v => v.code === code);
    setSelectedVoucher(voucher || null);
    // calculateFinalPrice will trigger via effect or we can call it here if we want instant update without effect dependency on selectedVoucher state (which is async)
    // better use effect on selectedVoucher
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const { room_ids, room_overrides, check_in, check_out, user_id, payment_method, source } = values;

      const roomsPayload = room_ids.map(id => {
        const room = rooms.find(r => r.room_id === id);
        const override = room_overrides?.[id] || {};
        const finalCin = override.check_in || check_in;
        const finalCout = override.check_out || check_out;

        return {
          room_id: id,
          checkin_date: finalCin.format("YYYY-MM-DD"),
          checkout_date: finalCout.format("YYYY-MM-DD"),
          price_per_night: room?.roomType?.base_price || 0
        };
      });

      onSubmit({
        user_id,
        checkin_date: check_in.format("YYYY-MM-DD"),
        checkout_date: check_out.format("YYYY-MM-DD"),
        rooms: roomsPayload,
        source: source || 'admin',  
        payment_method,
        voucher_code: selectedVoucher ? selectedVoucher.code : null
      });
      form.resetFields();
    });
  };

  return (
    <Modal
      title={isEditing ? 'Cập nhật đơn đặt phòng' : 'Thông tin đặt phòng mới'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={700}
      okText={isEditing ? 'Cập nhật' : 'Xác nhận đặt'}
      cancelText="Đóng"
      destroyOnHidden
    >

      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <Form.Item
          label="Khách hàng"
          name="user_id"
          rules={[{ required: true, message: 'Chọn khách hàng' }]}
        >
          <Select placeholder="Chọn khách hàng">
            {customers.map(c => (
              <Option value={c.user_id} key={c.user_id}>
                {c.full_name} - {c.phone}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Phòng"
          name="room_ids"
          rules={[{ required: true, message: 'Chọn ít nhất 1 phòng' }]}
        >
          <Select
            mode="multiple"
            placeholder="Chọn các phòng"
            onChange={(ids) => {
              // Cập nhật danh sách phòng kèm ngày mặc định nếu chưa có
              const currentOverrides = form.getFieldValue('room_overrides') || {};
              const newOverrides = { ...currentOverrides };
              ids.forEach(id => {
                if (!newOverrides[id]) {
                  newOverrides[id] = {
                    check_in: form.getFieldValue('check_in'),
                    check_out: form.getFieldValue('check_out')
                  };
                }
              });
              form.setFieldValue('room_overrides', newOverrides);
              calculateFinalPrice();
            }}
          >
            {rooms
              .filter(r => r.status === 'available' || (initialValues && initialValues.rooms && initialValues.rooms.some(br => br.room_id === r.room_id)))
              .map(r => (
                <Option key={r.room_id} value={r.room_id}>
                  Phòng {r.room_number} ({r.roomType?.name})
                </Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Chọn ngày nhận phòng"
          name="check_in"
          rules={[{ required: true, message: 'Vui lòng chọn ngày nhận phòng' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Ngày nhận phòng"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
            onChange={() => calculateFinalPrice()}
          />
        </Form.Item>

        <Form.Item
          label="Chọn ngày trả phòng"
          name="check_out"
          rules={[{ required: true, message: 'Vui lòng chọn ngày trả phòng' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Ngày trả phòng"
            disabledDate={(current) => {
              const cin = form.getFieldValue('check_in');
              return current && (cin ? current <= cin.endOf('day') : current < dayjs().endOf('day'));
            }}
            onChange={() => calculateFinalPrice()}
          />
        </Form.Item>

        {/* Tùy chỉnh ngày cho từng phòng */}
        <Form.Item shouldUpdate={(prev, curr) => prev.room_ids !== curr.room_ids}>
          {({ getFieldValue }) => {
            const selectedIds = getFieldValue('room_ids') || [];
            if (selectedIds.length <= 1) return null;

            return (
              <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 8, border: '1px border #f0f0f0' }}>
                <Typography.Title level={5}>Tùy chỉnh ngày theo phòng (Nếu có)</Typography.Title>
                {selectedIds.map(id => {
                  const room = rooms.find(r => r.room_id === id);
                  return (
                    <div key={id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed #e8e8e8' }}>
                      <Text strong>Phòng {room?.room_number}</Text>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Form.Item
                            name={['room_overrides', id, 'check_in']}
                            style={{ marginBottom: 0 }}
                            label="Nhận"
                          >
                            <DatePicker
                              size="small"
                              style={{ width: '100%' }}
                              format="DD/MM/YYYY"
                              onChange={() => calculateFinalPrice()}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name={['room_overrides', id, 'check_out']}
                            style={{ marginBottom: 0 }}
                            label="Trả"
                          >
                            <DatePicker
                              size="small"
                              style={{ width: '100%' }}
                              format="DD/MM/YYYY"
                              onChange={() => calculateFinalPrice()}
                            />
                          </Form.Item>
                        </Col>
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
            {vouchers.map(v => (
              <Option key={v.voucher_id} value={v.code}>
                <Space>
                  <Text strong>{v.code}</Text>
                  <Tag color="green">
                    {v.discount_type === 'percentage' ? `-${v.discount_value}%` : `-${parseInt(v.discount_value).toLocaleString('vi-VN')} VNĐ`}
                  </Tag>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {finalTotal > 0 && (
          <div style={{ marginBottom: 24, padding: '12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
            <Row justify="space-between" align="middle">
              <Text strong>Tổng cộng (Tạm tính):</Text>
              <Text type="success" strong style={{ fontSize: '18px' }}>
                {parseInt(finalTotal).toLocaleString('vi-VN')} VNĐ
              </Text>
            </Row>
          </div>
        )}

        
      </Form>
    </Modal >
  );
};

export default BookingForm;
