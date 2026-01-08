import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Rooms from "./pages/Rooms.jsx";
import RoomTypes from "./pages/RoomTypes.jsx";
import Services from "./pages/Services.jsx";
import Customers from "./pages/Customers.jsx";
import Bookings from "./pages/Bookings.jsx";
import ServiceUsage from "./pages/ServiceUsage.jsx";
import Payments from "./pages/Payments.jsx";
import Invoices from "./pages/Invoices.jsx";
import Reception from "./pages/Reception.jsx";
import Home from "./pages/home/Home.jsx";
import Register from "./pages/home/Register.jsx";
import Login from "./pages/home/Login.jsx";
import RoomDetail from "./pages/home/RoomDetail.jsx";
import BookingHistory from "./pages/home/BookingHistory.jsx";
import UserServiceRequest from "./pages/UserServiceRequest.jsx";
import Profile from "./pages/Profile.jsx";
import UserRoles from "./pages/UserRoles.jsx";
import FooterSettings from "./pages/FooterSettings.jsx";
import Vouchers from "./pages/Vouchers.jsx";

import PaymentResult from "./pages/home/PaymentResult.jsx";
import UserProfile from "./pages/home/UserProfile.jsx";
import Booking from "./pages/home/Booking.jsx";
import About from "./pages/home/About.jsx";
import CancellationPolicy from "./pages/home/CancellationPolicy.jsx";

const ProtectedRoute = ({ allow }) => {
  if (!allow) return <Navigate to="/403" replace />;
  return <Outlet />;
};

function App() {
  // ✅ lấy user từ localStorage (đổi key nếu bạn lưu khác)
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/cancellation-policy" element={<CancellationPolicy />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/user-profile" element={<UserProfile />} />
      <Route path="/room/:id" element={<RoomDetail />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/booking-history" element={<BookingHistory />} />
      <Route path="/my-services" element={<UserServiceRequest />} />
      <Route path="/payment/result" element={<PaymentResult />} />

      <Route element={<ProtectedRoute allow={isAdmin} />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/room-types" element={<RoomTypes />} />
          <Route path="/services" element={<Services />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/user-roles" element={<UserRoles />} />
          <Route path="/vouchers" element={<Vouchers />} />
          <Route path="/footer-settings" element={<FooterSettings />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={isAdmin || isStaff} />}>
        <Route element={<AdminLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/rooms" element={<Rooms />} />

          <Route path="/reception" element={<Reception />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/services-usage" element={<ServiceUsage />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/invoices" element={<Invoices />} />
        </Route>
      </Route>

      {/* 403 + fallback */}
      <Route
        path="/403"
        element={<div>403 - Bạn không có quyền truy cập</div>}
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;
