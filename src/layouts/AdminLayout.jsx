import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  HomeOutlined,
  AppstoreOutlined,
  UserOutlined,
  BookOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  FileTextOutlined

} from "@ant-design/icons";
import { Link, Outlet, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const location = useLocation();
  const selectedKey = location.pathname;

  const items = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: "/room-types",
      icon: <AppstoreOutlined />,
      label: <Link to="/room-types">Loại phòng</Link>,
    },
    {
      key: "/services",
      icon: <AppstoreOutlined />,
      label: <Link to="/services">Dịch vụ</Link>,
    },
    {
      key: "/rooms",
      icon: <HomeOutlined />,
      label: <Link to="/rooms">Quản lý phòng</Link>,
    },
    {
      key: "/customers",
      icon: <UserOutlined />,
      label: <Link to="/customers">Quản lý khách hàng</Link>,
    },
    {
      key: "/bookings",
      icon: <BookOutlined />,
      label: <Link to="/bookings">Đặt phòng</Link>,
    },
    {
      key: "/serviceUsage",
      icon: <ShoppingCartOutlined />,
      label: <Link to="/services-usage">Sử dụng dịch vụ</Link>,
    },
    {
      key: "/payments",
      icon: <DollarOutlined />,
      label: <Link to="/payments">Thanh toán</Link>,
    },
    {
      key: "/invoices",
      icon: <FileTextOutlined />,
      label: <Link to="/invoices">Hóa đơn</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible>
        <div
          style={{
            height: 64,
            margin: 16,
            color: "#fff",
            fontWeight: "bold",
            fontSize: 18,
            textAlign: "center",
            lineHeight: "64px",
          }}
        >
          Hotel Admin
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <span>Xin chào, Admin</span>
        </Header>
        <Content style={{ margin: "16px" }}>
          <div
            style={{
              padding: 24,
              background: "#fff",
              borderRadius: 8,
              minHeight: "calc(100vh - 64px - 32px)",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
