import { Link } from 'react-router-dom';
import { useState } from 'react';
import SearchBar from './SearchBar';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '32px', width: '32px', fill: '#003580' }}>
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 4V17c0 4.52-3.18 8.77-8 9.93-4.82-1.16-8-5.41-8-9.93V8.18l8-4zM11 17h2v-6h-2v6zm0-8h2V7h-2v2z" />
                    </svg>
                    <span className="logo-text">BOOKING</span>
                </Link>

                {/* Thanh tìm kiếm */}
                <SearchBar />

                {/* Menu người dùng */}
                <div className="navbar-user">

                    <div className="user-menu-container">
                        <button className="user-menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', fill: 'none', height: '16px', width: '16px', stroke: 'currentcolor', strokeWidth: 3, overflow: 'visible' }}>
                                <g fill="none" fillRule="nonzero">
                                    <path d="m2 16h28"></path>
                                    <path d="m2 24h28"></path>
                                    <path d="m2 8h28"></path>
                                </g>
                            </svg>
                            <div className="user-avatar">
                                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '30px', width: '30px', fill: 'currentcolor' }}>
                                    <path d="m16 .7c-8.437 0-15.3 6.863-15.3 15.3s6.863 15.3 15.3 15.3 15.3-6.863 15.3-15.3-6.863-15.3-15.3-15.3zm0 28c-4.021 0-7.605-1.884-9.933-4.81a12.425 12.425 0 0 1 6.451-4.4 6.507 6.507 0 0 1 -3.018-5.49c0-3.584 2.916-6.5 6.5-6.5s6.5 2.916 6.5 6.5a6.513 6.513 0 0 1 -3.019 5.491 12.42 12.42 0 0 1 6.452 4.4c-2.328 2.925-5.912 4.809-9.933 4.809z"></path>
                                </svg>
                            </div>
                        </button>
                        {isMenuOpen && (
                            <div className="user-dropdown">
                                {user ? (
                                    <>
                                        {(user.role === 'admin' || user.role === 'staff') && (
                                            <>
                                                <Link to="/dashboard" className="menu-item bold" style={{ color: '#1890ff' }}>Trang Quản Trị</Link>
                                                <div className="menu-divider"></div>
                                            </>
                                        )}
                                        <div className="menu-item user-info">
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                {user.full_name || 'Người dùng'}
                                            </div>
                                        </div>
                                        <div className="menu-divider"></div>
                                        <Link to="/user-profile" className="menu-item">Thông tin cá nhân</Link>
                                        <Link to="/booking-history" className="menu-item">Lịch sử đặt phòng</Link>
                                        <Link to="/my-services" className="menu-item">Dịch vụ của tôi</Link>
                                        <div className="menu-divider"></div>
                                        <div className="menu-item" onClick={handleLogout}>Đăng xuất</div>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/register" className="menu-item bold">Đăng ký</Link>
                                        <Link to="/login" className="menu-item">Đăng nhập</Link>
                                        <div className="menu-divider"></div>
                                        <div className="menu-item">Trung tâm trợ giúp</div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
