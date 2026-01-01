import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Rooms from "./pages/Rooms.jsx";
import RoomTypes from "./pages/RoomTypes.jsx";
import Services from "./pages/Services.jsx";
import Customers from './pages/Customers.jsx';
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/user-profile" element={<UserProfile />} />
      <Route path="/room/:id" element={<RoomDetail />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/booking-history" element={<BookingHistory />} />
      <Route path="/my-services" element={<UserServiceRequest />} />
      <Route path="/payment/result" element={<PaymentResult />} />

      {/* Admin Routes */}
      <Route element={<AdminLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reception" element={<Reception />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/room-types" element={<RoomTypes />} />
        <Route path="/services" element={<Services />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/user-roles" element={<UserRoles />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/services-usage" element={<ServiceUsage />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/vouchers" element={<Vouchers />} />
        <Route path="/footer-settings" element={<FooterSettings />} />
      </Route>
    </Routes>
  );
}

export default App;
