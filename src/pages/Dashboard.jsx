// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Progress,
  Table,
  Typography,
  Space,
  Select,
} from "antd";
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import roomApi from "../api/roomApi";
import paymentApi from "../api/paymentApi"; // 🔹 NEW

// 🔹 Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const { Title, Text } = Typography;
const { Option } = Select;

// =====================
// CHỮ & MÀU CHO STATUS
// =====================
const STATUS_LABEL = {
  available: "Trống",
  booked: "Đã đặt",
  occupied: "Đang ở",
  cleaning: "Đang dọn",
  maintenance: "Bảo trì",
};

const STATUS_COLOR = {
  available: "green",
  booked: "orange",
  occupied: "red",
  cleaning: "blue",
  maintenance: "purple",
};

const Dashboard = () => {
  // ============================
  // STATE LƯU DANH SÁCH PHÒNG
  // ============================
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // ============================
  // STATE LƯU THỐNG KÊ PAYMENT
  // ============================
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [paymentStats, setPaymentStats] = useState({
    year: currentYear,
    months: [],
    quarters: [],
  });
  const [loadingPayments, setLoadingPayments] = useState(false);

  // ============================
  // GỌI API LẤY TẤT CẢ PHÒNG
  // ============================
  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await roomApi.getAll(1, 1000);
      const list = res.data || res.data?.data || [];
      setRooms(list);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  };

  // ============================
  // GỌI API THỐNG KÊ PAYMENT
  // ============================
  const fetchPaymentStats = async (y = year) => {
    try {
      setLoadingPayments(true);
      const res = await paymentApi.getStats(y);
      // backend trả về { success, data: { year, months, quarters } }
      const stats = res.data || res.data?.data || res;
      setPaymentStats(stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Lấy phòng + payment khi vào dashboard
  useEffect(() => {
    fetchRooms();
    fetchPaymentStats(currentYear);
  }, []);

  // Khi đổi năm trong select
  const handleYearChange = (value) => {
    setYear(value);
    fetchPaymentStats(value);
  };

  // ============================================================
  // TÍNH TOÁN THỐNG KÊ PHÒNG (TOTAL, STATUS, OCCUPANCY, TYPE…)
  // ============================================================
  const stats = useMemo(() => {
    const total = rooms.length;

    const byStatus = {
      available: 0,
      booked: 0,
      occupied: 0,
      cleaning: 0,
      maintenance: 0,
    };

    const byType = {};

    rooms.forEach((r) => {
      if (byStatus[r.status] !== undefined) {
        byStatus[r.status] += 1;
      }

      const typeName = r.roomType?.name || "Khác";
      byType[typeName] = (byType[typeName] || 0) + 1;
    });

    const inUse = byStatus.booked + byStatus.occupied;
    const occupancyRate = total ? Math.round((inUse / total) * 100) : 0;

    return { total, byStatus, byType, occupancyRate, inUse };
  }, [rooms]);

  // Chuẩn hóa dữ liệu loại phòng để đổ vào bảng
  const roomTypeRows = useMemo(
    () =>
      Object.entries(stats.byType).map(([name, count], index) => ({
        key: index,
        name,
        count,
      })),
    [stats.byType]
  );

  // Cột bảng thống kê theo loại
  const typeColumns = [
    { title: "Loại phòng", dataIndex: "name", key: "name" },
    {
      title: "Số lượng",
      dataIndex: "count",
      key: "count",
      align: "center",
      width: 120,
    },
  ];

  // ======================
  // DATA BIỂU ĐỒ PAYMENT
  // ======================

  // 12 tháng, nếu tháng nào không có dữ liệu thì = 0
  const monthlyChartData = useMemo(() => {
    const map = {};
    (paymentStats.months || []).forEach((m) => {
      map[m.month] = m.total;
    });

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        month,
        label: `T${month}`,
        total: Number(map[month] || 0),
      };
    });
  }, [paymentStats.months]);

  // 4 quý
  const quarterlyChartData = useMemo(() => {
    return (paymentStats.quarters || []).map((q) => ({
      label: q.quarter, // "Q1", "Q2"...
      total: Number(q.total || 0),
    }));
  }, [paymentStats.quarters]);

  // Lấy ngày hiện tại
  const today = new Date().toLocaleDateString("vi-VN");

  return (
    <div style={{ padding: 8 }}>
      {/* HEADER */}
      <Card style={{ marginBottom: 16, borderRadius: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ marginBottom: 4 }}>
              Dashboard
            </Title>
            <Text type="secondary">
              Chào mừng bạn quay lại hệ thống quản lý khách sạn 👋
            </Text>
          </Col>
          <Col>
            <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>
              Hôm nay: {today}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* 3 THẺ THỐNG KÊ TỔNG QUAN */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card
            loading={loadingRooms}
            style={{
              borderRadius: 16,
              background:
                "linear-gradient(135deg, rgba(24,144,255,0.1), rgba(24,144,255,0.02))",
            }}
          >
            <Space align="start">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#1890ff20",
                }}
              >
                <ApartmentOutlined style={{ fontSize: 22, color: "#1890ff" }} />
              </div>
              <Statistic title="Tổng số phòng" value={stats.total} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            loading={loadingRooms}
            style={{
              borderRadius: 16,
              background:
                "linear-gradient(135deg, rgba(82,196,26,0.12), rgba(82,196,26,0.03))",
            }}
          >
            <Space align="start">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#52c41a20",
                }}
              >
                <HomeOutlined style={{ fontSize: 22, color: "#52c41a" }} />
              </div>
              <Statistic
                title="Phòng trống"
                value={stats.byStatus.available}
                suffix={` / ${stats.total}`}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            loading={loadingRooms}
            style={{
              borderRadius: 16,
              background:
                "linear-gradient(135deg, rgba(250,173,20,0.12), rgba(250,173,20,0.04))",
            }}
          >
            <Space align="start">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#faad1420",
                }}
              >
                <CheckCircleOutlined
                  style={{ fontSize: 22, color: "#faad14" }}
                />
              </div>
              <div>
                <Statistic
                  title="Đang sử dụng (Đã đặt + Đang ở)"
                  value={stats.inUse}
                  suffix={` / ${stats.total}`}
                />
                <Progress
                  percent={stats.occupancyRate}
                  size="small"
                  style={{ marginTop: 8, maxWidth: 220 }}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* THỐNG KÊ CHI TIẾT PHÒNG */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title="Tình trạng phòng"
            style={{ borderRadius: 16 }}
            loading={loadingRooms}
          >
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div
                key={status}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                }}
              >
                <Space>
                  <Tag color={STATUS_COLOR[status]}>
                    {STATUS_LABEL[status]}
                  </Tag>
                </Space>
                <Text strong>
                  {count}{" "}
                  <Text type="secondary">
                    ({stats.total
                      ? Math.round((count / stats.total) * 100)
                      : 0}
                    %)
                  </Text>
                </Text>
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Số phòng theo loại" style={{ borderRadius: 16 }}>
            <Table
              columns={typeColumns}
              dataSource={roomTypeRows}
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* BIỂU ĐỒ DOANH THU */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <span>Doanh thu theo tháng & theo quý</span>
                <Select
                  size="small"
                  value={year}
                  onChange={handleYearChange}
                  style={{ width: 100 }}
                >
                  {/* cho phép chọn ±2 năm quanh hiện tại */}
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <Option key={y} value={y}>
                      {y}
                    </Option>
                  ))}
                </Select>
              </Space>
            }
            loading={loadingPayments}
            style={{ borderRadius: 16 }}
          >
            <Row gutter={[16, 16]}>
              {/* Biểu đồ tháng */}
              <Col xs={24} md={16}>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `${Number(value).toLocaleString("vi-VN")} VNĐ`
                        }
                      />
                      <Bar dataKey="total" fill="#1890ff" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Col>

              {/* Biểu đồ quý */}
              <Col xs={24} md={8}>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quarterlyChartData}>
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `${Number(value).toLocaleString("vi-VN")} VNĐ`
                        }
                      />
                      <Bar dataKey="total" fill="#faad14" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
