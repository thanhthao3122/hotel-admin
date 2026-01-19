// src/layouts/AdminLayout.jsx
import { useMemo, useEffect } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Breadcrumb,
  Typography,
} from "antd";
import {
  DashboardOutlined,
  HomeOutlined,
  AppstoreOutlined,
  UserOutlined,
  BookOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const userData = useMemo(() => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : {};
    } catch (e) {
      return {};
    }
  }, []);

  const isAuthorized = useMemo(() => {
    return userData.role === "admin" || userData.role === "staff";
  }, [userData]);

  // Check role and redirect if not authorized
  useEffect(() => {
    if (!isAuthorized) {
      navigate("/home");
    }
  }, [isAuthorized, navigate]);

  // If not authorized, don't render anything to prevent flickering or data fetching in children
  if (!isAuthorized) {
    return null;
  }

  // Lấy segment đầu tiên trong URL ("/rooms/123" -> "/rooms")
  const rootPath = "/" + location.pathname.split("/")[1];

  // Nếu đang ở root "/" thì mặc định là Dashboard
  const selectedKey = rootPath === "/" ? "/dashboard" : rootPath;

  // Cờ: đang ở trang Dashboard hay không
  const isDashboard = selectedKey === "/dashboard";

  // Cấu hình menu: key, icon, label, group (để hiển thị theo nhóm)
  const menuConfig = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Tổng quan",
      group: "HỆ THỐNG",
      roles: ["admin", "staff"],
    },
    {
      key: "/vouchers",
      icon: <PercentageOutlined />,
      label: "Quản lý Voucher",
      group: "NGHIỆP VỤ",
      roles: ["admin", "staff"],
    },
    {
      key: "/room-types",
      icon: <AppstoreOutlined />,
      label: "Loại phòng",
      group: "NGHIỆP VỤ",
      roles: ["admin"],
    },
    {
      key: "/rooms",
      icon: <HomeOutlined />,
      label: "Quản lý phòng",
      group: "NGHIỆP VỤ",
      roles: ["admin","staff"],
    },

    {
      key: "/bookings",
      icon: <BookOutlined />,
      label: "Đặt phòng",
      group: "NGHIỆP VỤ",
      roles: ["admin", "staff"],
    },
    {
      key: "/services",
      icon: <AppstoreOutlined />,
      label: "Dịch vụ",
      group: "NGHIỆP VỤ",
      roles: ["admin"],
    },
    {
      key: "/services-usage",
      icon: <ShoppingCartOutlined />,
      label: "Sử dụng dịch vụ",
      group: "NGHIỆP VỤ",
      roles: ["admin", "staff"],
    },
    {
      key: "/payments",
      icon: <DollarOutlined />,
      label: "Thanh toán",
      group: "TÀI CHÍNH",
      roles: ["admin", "staff"],
    },
    {
      key: "/invoices",
      icon: <FileTextOutlined />,
      label: "Hóa đơn",
      group: "TÀI CHÍNH",
      roles: ["admin", "staff"],
    },
    {
      key: "/customers",
      icon: <UserOutlined />,
      label: "Khách hàng",
      group: "NGHIỆP VỤ",
      roles: ["admin"],
    },
    {
      key: "/footer-settings",
      icon: <SettingOutlined />,
      label: "Cài đặt Footer",
      group: "TÀI CHÍNH",
      roles: ["admin"],
    },
  ];

  // Gom các item theo group để dùng Menu group
  const grouped = menuConfig.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
  const filteredMenu = menuConfig.filter((item) => item.roles.includes(role));
  const groupedMenu = filteredMenu.reduce((acc, item) => {
    const group = item.group || "KHÁC";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
  const menuItems = Object.entries(groupedMenu).map(([groupName, items]) => ({
    type: "group",
    label: groupName,
    children: items.map((it) => ({
      key: it.key,
      icon: it.icon,
      label: <Link to={it.key}>{it.label}</Link>,
    })),
  }));

  // Dùng để hiển thị title + breadcrumb
  const currentMenu = menuConfig.find((m) => m.key === selectedKey);
  const currentTitle = currentMenu?.label || "Dashboard";

  // Xử lý khi click vào menu user (logout, profile, etc.)
  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      // Xóa token khỏi localStorage
      localStorage.removeItem("token");
      // Chuyển về trang login
      navigate("/login");
    } else if (key === "profile") {
      // Chuyển đến trang profile
      navigate("/profile");
    }
  };

  // Dropdown ở góc phải header (tài khoản admin)
  const userMenu = {
    items: [
      {
        key: "profile",
        label: "Thông tin tài khoản",
        icon: <UserSwitchOutlined />,
      },
      {
        type: "divider",
      },
      {
        key: "logout",
        label: "Đăng xuất",
        icon: <LogoutOutlined />,
      },
    ],
    onClick: handleMenuClick,
  };

  // Breadcrumb: Dashboard / Trang hiện tại
  const breadcrumbItems = [
    { title: <Link to="/dashboard">Dashboard</Link> },
    ...(currentMenu ? [{ title: currentMenu.label }] : []),
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* SIDEBAR TRÁI */}
      <Sider
        collapsible
        breakpoint="lg"
        style={{
          boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* Logo / brand hệ thống */}
        <div
          style={{
            height: 64,
            margin: 20,
            borderRadius: 12,
            background: "linear-gradient(135deg, #1890ff, #36cfc9)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            textAlign: "center",
            lineHeight: "65px",
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          HOTEL ADMIN
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
        />
      </Sider>

      {/* KHU VỰC NỘI DUNG BÊN PHẢI */}
      <Layout>
        {/* HEADER TRÊN */}
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Breadcrumb + tiêu đề trang */}
          <div>
            <Breadcrumb items={breadcrumbItems} />
            <Title level={4} style={{ margin: 0, marginTop: 4 }}>
              {currentTitle}
            </Title>
          </div>

          {/* Thông tin admin */}
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <div
                style={{
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  lineHeight: "1.4",
                }}
              >
                <Text strong>{userData.full_name || "Admin"}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {userData.role?.toUpperCase() || "ADMIN"}
                </Text>
              </div>
              <Avatar size="large" style={{ backgroundColor: "#1890ff" }}>
                {userData.full_name?.charAt(0) || "A"}
              </Avatar>
            </Space>
          </Dropdown>
        </Header>

        {/* CONTENT: Dashboard & các trang còn lại xử lý khác nhau */}
        <Content style={{ margin: isDashboard ? 0 : "16px" }}>
          <div
            style={{
              padding: isDashboard ? 0 : 24,

              // NỀN CONTENT NHẸ – RÕ – AN TOÀN
              background: isDashboard ? "transparent" : "#f6f8fb",

              borderRadius: isDashboard ? 0 : 16,
              minHeight: "calc(100vh - 64px - 32px - 48px)",

              // shadow nhẹ để phân lớp
              boxShadow: isDashboard ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Outlet />
          </div>
        </Content>

        {/* FOOTER – ghi chú đồ án */}
        <Footer
          style={{
            textAlign: "center",
            padding: "8px 24px 16px",
            background: "transparent",
            color: "#999",
            fontSize: 12,
          }}
        >
          Hệ thống quản lý đặt phòng khách sạn - Đồ án tốt nghiệp
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
