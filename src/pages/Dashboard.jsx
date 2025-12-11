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
import paymentApi from "../api/paymentApi";

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

// STATUS MAP
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
  // ROOM STATES
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // PAYMENT STATES
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [paymentStats, setPaymentStats] = useState({
    year: currentYear,
    months: [],
    quarters: [],
  });
  const [loadingPayments, setLoadingPayments] = useState(false);

  // FETCH ROOMS
  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await roomApi.getAll(1, 1000);
      const list = res.data?.data || res.data || [];
      setRooms(list);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  };

  // FETCH PAYMENT STATS
  const fetchPaymentStats = async (y) => {
    try {
      setLoadingPayments(true);
      const res = await paymentApi.getStats(y);
      const stats = res.data?.data || res.data || res;
      setPaymentStats(stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // INIT LOAD
  useEffect(() => {
    fetchRooms();
    fetchPaymentStats(currentYear);
  }, []);

  // CHANGE YEAR
  const handleYearChange = (value) => {
    setYear(value);
    fetchPaymentStats(value);
  };

  // ROOM STATISTICS
  const roomStats = useMemo(() => {
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
        byStatus[r.status]++;
      }

      const typeName = r.roomType?.name || "Khác";
      byType[typeName] = (byType[typeName] || 0) + 1;
    });

    const inUse = byStatus.booked + byStatus.occupied;
    const occupancyRate = total ? Math.round((inUse / total) * 100) : 0;

    return { total, byStatus, byType, inUse, occupancyRate };
  }, [rooms]);

  // TABLE ROOM TYPE DATA
  const roomTypeRows = useMemo(
    () =>
      Object.entries(roomStats.byType).map(([name, count], index) => ({
        key: index,
        name,
        count,
      })),
    [roomStats.byType]
  );

  // CHART MONTHLY DATA
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

  // CHART QUARTER DATA
  const quarterlyChartData = useMemo(() => {
    return (paymentStats.quarters || []).map((q) => ({
      label: q.quarter,
      total: Number(q.total || 0),
    }));
  }, [paymentStats.quarters]);

  // CURRENT DATE
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
            <Text type="secondary">Chào mừng bạn quay lại hệ thống 👋</Text>
          </Col>
          <Col>
            <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>
              Hôm nay: {today}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* OVERVIEW CARDS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card loading={loadingRooms} style={{ borderRadius: 16 }}>
            <Space>
              <ApartmentOutlined style={{ fontSize: 28, color: "#1890ff" }} />
              <Statistic title="Tổng số phòng" value={roomStats.total} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card loading={loadingRooms} style={{ borderRadius: 16 }}>
            <Space>
              <HomeOutlined style={{ fontSize: 28, color: "#52c41a" }} />
              <Statistic
                title="Phòng trống"
                value={roomStats.byStatus.available}
                suffix={` / ${roomStats.total}`}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card loading={loadingRooms} style={{ borderRadius: 16 }}>
            <Space>
              <CheckCircleOutlined style={{ fontSize: 28, color: "#faad14" }} />
              <div>
                <Statistic
                  title="Đang sử dụng"
                  value={roomStats.inUse}
                  suffix={` / ${roomStats.total}`}
                />
                <Progress
                  percent={roomStats.occupancyRate}
                  size="small"
                  style={{ marginTop: 6 }}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* ROOM DETAILS */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Tình trạng phòng" style={{ borderRadius: 16 }}>
            {Object.entries(roomStats.byStatus).map(([status, count]) => (
              <Row key={status} justify="space-between" style={{ padding: "6px 0" }}>
                <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
                <Text strong>
                  {count}{" "}
                  <Text type="secondary">
                    ({roomStats.total
                      ? Math.round((count / roomStats.total) * 100)
                      : 0}
                    %)
                  </Text>
                </Text>
              </Row>
            ))}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Số phòng theo loại" style={{ borderRadius: 16 }}>
            <Table
              columns={[
                { title: "Loại phòng", dataIndex: "name" },
                {
                  title: "Số lượng",
                  dataIndex: "count",
                  align: "center",
                  width: 120,
                },
              ]}
              dataSource={roomTypeRows}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* PAYMENT CHART */}
      <Row style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <span>Doanh thu theo tháng & quý</span>
                <Select
                  size="small"
                  value={year}
                  onChange={handleYearChange}
                  style={{ width: 100 }}
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <Option key={y} value={y}>
                      {y}
                    </Option>
                  ))}
                </Select>
              </Space>
            }
            style={{ borderRadius: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip
                        formatter={(v) =>
                          `${Number(v).toLocaleString("vi-VN")} VNĐ`
                        }
                      />
                      <Bar dataKey="total" fill="#1890ff" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Col>

              <Col xs={24} md={8}>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quarterlyChartData}>
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip
                        formatter={(v) =>
                          `${Number(v).toLocaleString("vi-VN")} VNĐ`
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
