import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Rooms from "./pages/Rooms.jsx";
import RoomTypes from "./pages/RoomTypes.jsx"; // 👈 thêm dòng này
import Services from "./pages/Services.jsx";
import Customers from './pages/Customers.jsx';
import Bookings from "./pages/Bookings.jsx";
import ServiceUsage from "./pages/ServiceUsage.jsx";
import Payments from "./pages/Payments.jsx";
import Invoices from "./pages/Invoices.jsx";

function App() {
  // Tạm thời cho luôn đăng nhập,
  // sau này mình sẽ làm màn Login riêng.
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return (
      <Routes>
        {/* Sau này sẽ có <Route path="/login" ...> */}
        <Route path="*" element={<div>Login page (chưa làm)</div>} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/room-types" element={<RoomTypes />} />
        <Route path="/services" element={<Services />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/services-usage" element={<ServiceUsage />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/invoices" element={<Invoices />} />



      </Route>
    </Routes>
  );
}

export default App;
