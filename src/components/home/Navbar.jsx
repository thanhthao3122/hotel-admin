import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const updateCount = () => {
      const saved = sessionStorage.getItem('selectedRooms');
      const rooms = saved ? JSON.parse(saved) : [];
      setSelectedCount(rooms.length);
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    return () => window.removeEventListener('storage', updateCount);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="presentation"
            focusable="false"
            style={{
              display: "block",
              height: "32px",
              width: "32px",
              fill: "#003580",
            }}
          >
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 4V17c0 4.52-3.18 8.77-8 9.93-4.82-1.16-8-5.41-8-9.93V8.18l8-4zM11 17h2v-6h-2v6zm0-8h2V7h-2v2z" />
          </svg>
          <span className="logo-text">BOOKING</span>
        </Link>

        {/* Search Bar */}
        <SearchBar />

        {/* User Menu */}
        <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/booking" className="booking-cart-link" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: selectedCount > 0 ? '#ff5a5f' : '#f7f7f7',
            color: selectedCount > 0 ? 'white' : '#222',
            borderRadius: '20px',
            fontWeight: 'bold',
            textDecoration: 'none',
            border: selectedCount > 0 ? 'none' : '1px solid #ddd'
          }}>
            <span className="cart-icon">🛒</span>
            <span>{selectedCount > 0 ? `Đặt ngay (${selectedCount})` : 'Danh sách (0)'}</span>
          </Link>
          <div className="user-menu-container">
            <button
              className="user-menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                role="presentation"
                focusable="false"
                style={{
                  display: "block",
                  fill: "none",
                  height: "16px",
                  width: "16px",
                  stroke: "currentcolor",
                  strokeWidth: 3,
                  overflow: "visible",
                }}
              >
                <g fill="none" fillRule="nonzero">
                  <path d="m2 16h28"></path>
                  <path d="m2 24h28"></path>
                  <path d="m2 8h28"></path>
                </g>
              </svg>
              <div className="user-avatar">
                <svg
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  role="presentation"
                  focusable="false"
                  style={{
                    display: "block",
                    height: "30px",
                    width: "30px",
                    fill: "currentcolor",
                  }}
                >
                  <path d="m16 .7c-8.437 0-15.3 6.863-15.3 15.3s6.863 15.3 15.3 15.3 15.3-6.863 15.3-15.3-6.863-15.3-15.3-15.3zm0 28c-4.021 0-7.605-1.884-9.933-4.81a12.425 12.425 0 0 1 6.451-4.4 6.507 6.507 0 0 1 -3.018-5.49c0-3.584 2.916-6.5 6.5-6.5s6.5 2.916 6.5 6.5a6.513 6.513 0 0 1 -3.019 5.491 12.42 12.42 0 0 1 6.452 4.4c-2.328 2.925-5.912 4.809-9.933 4.809z"></path>
                </svg>
              </div>
            </button>
            {isMenuOpen && (
              <div className="user-dropdown">
                {user ? (
                  <>
                    <div className="menu-item user-info">
                      {user?.role === "admin" ? (
                        <Link to="/dashboard">
                          <div
                            style={{ fontWeight: "bold", marginBottom: "4px" }}
                          >
                            {user?.full_name || "Người dùng"}
                          </div>
                        </Link>
                      ) : (
                        <div
                          style={{ fontWeight: "bold", marginBottom: "4px" }}
                        >
                          {user?.full_name || "Người dùng"}
                        </div>
                      )}
                    </div>
                    <div className="menu-divider"></div>
                    <Link to="/user-profile" className="menu-item">
                      Thông tin cá nhân
                    </Link>
                    <Link to="/booking-history" className="menu-item">
                      Lịch sử đặt phòng
                    </Link>
                    <Link to="/my-services" className="menu-item">
                      Dịch vụ của tôi
                    </Link>
                    <div className="menu-divider"></div>
                    <div className="menu-item" onClick={handleLogout}>
                      Đăng xuất
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="menu-item bold">
                      Đăng ký
                    </Link>
                    <Link to="/login" className="menu-item">
                      Đăng nhập
                    </Link>
                    <div className="menu-divider"></div>
                    <Link to="/about" className="menu-item">Về chúng tôi</Link>
                    <div className="menu-item">Trung tâm trợ giúp</div>
                  </>
                )
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
