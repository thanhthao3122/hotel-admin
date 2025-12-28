import { Card, Row, Col, Statistic, Tag, Progress, Table, Typography, Space, Select, Button, message } from "antd";
import { ApartmentOutlined, CheckCircleOutlined, HomeOutlined, FileExcelOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import roomApi from "../api/roomApi";
import paymentApi from "../api/paymentApi";
import socket from "../utils/socket";

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
    transactions: [],
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
      const stats = res.data || res;
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
    fetchPaymentStats(year);
  }, []);

  // ✅ Real-time listeners
  useEffect(() => {
    const handleRefresh = () => {
      fetchRooms();
      fetchPaymentStats(year);
    };

    socket.on("room_status_updated", fetchRooms);
    socket.on("room_created", fetchRooms);
    socket.on("room_deleted", fetchRooms);
    socket.on("room_updated", fetchRooms);
    socket.on("booking_created", handleRefresh);
    socket.on("booking_updated", handleRefresh);
    socket.on("booking_deleted", handleRefresh);
    socket.on("payment_received", handleRefresh);

    return () => {
      socket.off("room_status_updated", fetchRooms);
      socket.off("room_created", fetchRooms);
      socket.off("room_deleted", fetchRooms);
      socket.off("room_updated", fetchRooms);
      socket.off("booking_created", handleRefresh);
      socket.off("booking_updated", handleRefresh);
      socket.off("booking_deleted", handleRefresh);
      socket.off("payment_received", handleRefresh);
    };
  }, [year]);

  // CHANGE YEAR
  const handleYearChange = (value) => {
    setYear(value);
    fetchPaymentStats(value);
  };

  // ROOM 
  const roomStats = useMemo(() => {
    const total = rooms.length; //tổng số phòng
//thống kê theo trạng thái phòng
    const byStatus = {
      available: 0,
      booked: 0,
      occupied: 0,
      cleaning: 0,
      maintenance: 0,
    };
// thống kê theo loại phòng
    const byType = {};
// duyệt từng phòng trong room
    rooms.forEach((r) => {
      if (byStatus[r.status] !== undefined) { // đếm phòng theo trạng thái
        byStatus[r.status]++;
      }
// đếm phòng theo loại phòng
      const typeName = r.roomType?.name || "Khác";
      byType[typeName] = (byType[typeName] || 0) + 1;
    });
    const inUse = byStatus.booked + byStatus.occupied; // số phòng đang được sử dụng

    const occupancyRate = total ? Math.round((inUse / total) * 100) : 0; // tỉ

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

  // EXPORT MONTHLY STATS
  const handleExportMonthly = () => {
    const workbook = XLSX.utils.book_new();

    // 1. PRIMARY SHEET: Detailed Daily Transactions (Grouped by Month)
    const sortedTransactions = [...(paymentStats.transactions || [])].sort((a, b) =>
      new Date(a.payment_date) - new Date(b.payment_date)
    );

    const monthlyGroups = {};
    for (let i = 1; i <= 12; i++) monthlyGroups[i] = [];

    sortedTransactions.forEach(t => {
      const month = new Date(t.payment_date).getMonth() + 1;
      monthlyGroups[month].push(t);
    });

    const aoaDetails = [
      ["DANH SÁCH CHI TIẾT GIAO DỊCH THEO THÁNG", ""],
      ["Năm báo cáo", year],
      ["", ""],
      ["STT", "Ngày", "Khách hàng", "Mã đặt phòng", "Phương thức", "Số tiền (VNĐ)"]
    ];

    let grandTotal = 0;
    let stt = 1;

    for (let m = 1; m <= 12; m++) {
      const group = monthlyGroups[m];
      if (group.length > 0) {
        // Month Header
        aoaDetails.push([`BÁO CÁO THÁNG ${m}`, "", "", "", "", ""]);

        let monthTotal = 0;
        group.forEach(t => {
          const amount = Number(t.amount || 0);
          aoaDetails.push([
            stt++,
            new Date(t.payment_date).toLocaleDateString("vi-VN"),
            t.booking?.user?.full_name || "N/A",
            t.booking_id,
            t.payment_method === "cash" ? "Tiền mặt" : "VNPay",
            amount
          ]);
          monthTotal += amount;
          grandTotal += amount;
        });

        // Month Subtotal
        aoaDetails.push(["", "", "", "", `CỘNG THÁNG ${m}:`, monthTotal]);
        aoaDetails.push([]); // Spacer
      }
    }

    // Grand Total
    aoaDetails.push(["", "", "", "", "TỔNG CỘNG CẢ NĂM:", grandTotal]);

    const wsDetails = XLSX.utils.aoa_to_sheet(aoaDetails);
    XLSX.utils.book_append_sheet(workbook, wsDetails, "Chi Tiết Theo Tháng");

    // 2. Monthly Revenue Summary
    const monthlyData = monthlyChartData.map(d => ({
      "Tháng": d.label,
      "Năm": year,
      "Tổng doanh thu (VNĐ)": d.total
    }));
    const wsMonth = XLSX.utils.json_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(workbook, wsMonth, "Tổng Hợp 12 Tháng");

    // 3. Overall Summary
    const summaryData = [
      ["BÁO CÁO TỔNG QUAN KHÁCH SẠN", ""],
      ["Năm", year],
      ["Ngày xuất", new Date().toLocaleDateString("vi-VN")],
      ["", ""],
      ["TỔNG QUAN PHÒNG", ""],
      ["Tổng số phòng", roomStats.total],
      ["Phòng đang sử dụng", roomStats.inUse],
      ["Công suất phòng (%)", `${roomStats.occupancyRate}%`],
      ["", ""],
      ["TÌNH TRẠNG PHÒNG CHI TIẾT", "SỐ LƯỢNG"],
      ...Object.entries(roomStats.byStatus).map(([s, count]) => [STATUS_LABEL[s], count])
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Tóm Tắt Tổng Quan");

    // Save file
    XLSX.writeFile(workbook, `BaoCao_Thang_${year}.xlsx`);
    message.success("Đã xuất báo cáo tháng chi tiết thành công");
  };

  // EXPORT QUARTERLY STATS
  const handleExportQuarterly = () => {
    const workbook = XLSX.utils.book_new();

    // 1. Transaction Log (Grouped by Quarter)
    const transactions = [...(paymentStats.transactions || [])].sort((a, b) =>
      new Date(a.payment_date) - new Date(b.payment_date)
    );

    const quarterlyGroups = { 1: [], 2: [], 3: [], 4: [] };
    transactions.forEach(t => {
      const month = new Date(t.payment_date).getMonth() + 1;
      const q = Math.ceil(month / 3);
      quarterlyGroups[q].push(t);
    });

    const aoaDetails = [
      ["DANH SÁCH GIAO DỊCH CHI TIẾT THEO QUÝ", ""],
      ["Năm báo cáo", year],
      ["", ""],
      ["STT", "Ngày", "Khách hàng", "Mã đặt phòng", "Phương thức", "Số tiền (VNĐ)"]
    ];

    let overallTotal = 0;
    let stt = 1;

    [1, 2, 3, 4].forEach(q => {
      const group = quarterlyGroups[q];
      if (group.length > 0) {
        // Quarter Header
        aoaDetails.push([`BÁO CÁO QUÝ ${q}`, "", "", "", "", ""]);

        let qTotal = 0;
        group.forEach(t => {
          const amount = Number(t.amount || 0);
          aoaDetails.push([
            stt++,
            new Date(t.payment_date).toLocaleDateString("vi-VN"),
            t.booking?.user?.full_name || "N/A",
            t.booking_id,
            t.payment_method === "cash" ? "Tiền mặt" : "VNPay",
            amount
          ]);
          qTotal += amount;
          overallTotal += amount;
        });

        // Quarter Subtotal
        aoaDetails.push(["", "", "", "", `CỘNG QUÝ ${q}:`, qTotal]);
        aoaDetails.push([]); // Empty row for spacing
      }
    });

    // Grand Total at the very bottom
    aoaDetails.push(["", "", "", "", "TỔNG CỘNG CẢ NĂM:", overallTotal]);

    const wsDetails = XLSX.utils.aoa_to_sheet(aoaDetails);
    XLSX.utils.book_append_sheet(workbook, wsDetails, "Nhóm Theo Quý");

    // 2. Quarterly Revenue Summary Sheet
    const quarterlyData = quarterlyChartData.map(d => ({
      "Quý": d.label,
      "Năm": year,
      "Tổng doanh thu (VNĐ)": d.total
    }));
    const wsQuarter = XLSX.utils.json_to_sheet(quarterlyData);
    XLSX.utils.book_append_sheet(workbook, wsQuarter, "Tổng Kết Quý");

    // Save file
    XLSX.writeFile(workbook, `BaoCao_Quy_${year}.xlsx`);
    message.success("Đã xuất báo cáo quý chi tiết thành công");
  };

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
              <Row justify="space-between" align="middle" style={{ width: "100%" }}>
                <Col>
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
                </Col>
                <Col>
                  <Space>
                    <Button
                      type="primary"
                      icon={<FileExcelOutlined />}
                      size="small"
                      style={{ background: "#52c41a" }}
                      onClick={handleExportMonthly}
                    >
                      Báo cáo Tháng
                    </Button>
                    <Button
                      type="primary"
                      icon={<FileExcelOutlined />}
                      size="small"
                      style={{ background: "#faad14", borderColor: "#faad14" }}
                      onClick={handleExportQuarterly}
                    >
                      Báo cáo Quý
                    </Button>
                  </Space>
                </Col>
              </Row>
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
