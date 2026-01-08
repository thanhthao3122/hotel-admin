import { useEffect, useState } from "react";
import { Modal, Card, Table, Tag, Button, Popconfirm, Space, message } from "antd";
import bookingApi from "../api/bookingApi";

const BookingDetail = ({ open, onCancel, booking }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  // ====== STATUS COLORS ======
  const bookingStatusColor = {
    pending: "gold",
    confirmed: "blue",
    completed: "green",
    cancelled: "red",
  };

  const bookingRoomStatusColor = {
    pending: "gold",
    checked_in: "green",
    checked_out: "blue",
    cancelled: "red",
  };

  const roomStatusColor = {
    available: "green",
    occupied: "red",
    maintenance: "gray",
    cleaning: "purple",
  };

  // ====== LOAD BOOKING DETAIL ======
  useEffect(() => {
    if (!booking?.booking_id || !open) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const res = await bookingApi.getById(booking.booking_id);
        setDetail(res.data);
      } catch (e) {
        console.error(e);
        message.error("Không tải được chi tiết đặt phòng");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [booking, open]);

  if (!detail) return null;

  // ====== ACTION API CALLS ======
  const updateRoomStatus = async (bookingRoomId, status) => {
    try {
      await bookingApi.updateRoomStatus(bookingRoomId, status);
      message.success("Cập nhật thành công");

      // reload detail
      const res = await bookingApi.getById(detail.booking_id);
      setDetail(res.data);
    } catch (e) {
      console.error(e);
      message.error("Lỗi cập nhật trạng thái");
    }
  };

  // ====== TABLE COLUMNS ======
  const columns = [
    {
      title: "Phòng",
      render: (_, r) => r.room?.room_number || "N/A", 
    },
    {
      title: "Check-in",
      dataIndex: "checkin_date",
    },
    {
      title: "Check-out",
      dataIndex: "checkout_date",
    },
    {
      title: "Trạng thái BookingRoom",
      render: (_, r) => (
        <Tag color={bookingRoomStatusColor[r.status]}>
          {r.status}
        </Tag>
      ),
    },
    {
      title: "Trạng thái Phòng",
      render: (_, r) => (
        <Tag color={roomStatusColor[r.room?.status]}>
          {r.room?.status}
        </Tag>
      ),
    },
    {
      title: "Action",
      render: (_, r) => (
        <Space>
          {r.status === "pending" && (
            <>
              <Popconfirm
                title="Xác nhận Check-in?"
                onConfirm={() => updateRoomStatus(r.id, "checked_in")}
              >
                <Button type="primary">Check-in</Button>
              </Popconfirm>

              <Popconfirm
                title="Huỷ phòng này?"
                onConfirm={() => updateRoomStatus(r.id, "cancelled")}
              >
                <Button danger>Huỷ</Button>
              </Popconfirm>
            </>
          )}

          {r.status === "checked_in" && (
            <Popconfirm
              title="Xác nhận Check-out?"
              onConfirm={() => updateRoomStatus(r.id, "checked_out")}
            >
              <Button>Check-out</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      title={`Chi tiết đặt phòng #${detail.booking_id}`}
    >
      <Card title="Thông tin khách hàng" style={{ marginBottom: 12 }}>
        <p><b>Khách:</b> {detail.user?.full_name}</p>
        <p><b>SĐT:</b> {detail.user?.phone}</p>
        <p><b>Check-in:</b> {detail.checkin_date}</p>
        <p><b>Check-out:</b> {detail.checkout_date}</p>
        <p>
          <b>Trạng thái:</b>{" "}
          <Tag color={bookingStatusColor[detail.status]}>
            {detail.status}
          </Tag>
        </p>
        <p>
          <b>Tổng tiền:</b>{" "}
          {Number(detail.total_price).toLocaleString("vi-VN")} VNĐ
        </p>
      </Card>

      <Card title="Danh sách phòng">
        <Table
          dataSource={detail.bookingRooms}
          columns={columns}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </Card>
    </Modal>
  );
};

export default BookingDetail;
