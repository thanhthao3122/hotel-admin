import { Link, useLocation } from 'react-router-dom';
import './SubNavbar.css';

const SubNavbar = () => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    const menuItems = [
        {
            path: '/home',
            label: 'Phòng',
            icon: (
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path d="M21 10.78V8c0-1.65-1.35-3-3-3h-4c-.77 0-1.47.3-2 .78-.53-.48-1.23-.78-2-.78H6C4.35 5 3 6.35 3 8v2.78c-.61.55-1 1.34-1 2.22v6c0 .55.45 1 1 1h2v-5h14v5h2c.55 0 1-.45 1-1v-6c0-.88-.39-1.67-1-2.22zM14 7h4c.55 0 1 .45 1 1v2h-6V8c0-.55.45-1 1-1zM5 8c0-.55.45-1 1-1h4c.55 0 1 .45 1 1v2H5V8z" />
                </svg>
            )
        },
        {
            path: '/my-services',
            label: 'Dịch vụ',
            icon: (
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
                </svg>
            ),
            requireAuth: true
        },
        {
            path: '/booking-history',
            label: 'Thanh toán',
            icon: (
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                </svg>
            ),
            requireAuth: true
        }
    ];

    return (
        <div className="sub-navbar">
            <div className="sub-navbar-container">
                <div className="sub-navbar-menu">
                    {menuItems.map((item) => {
                        // Bỏ qua các mục yêu cầu xác thực nếu người dùng chưa đăng nhập
                        if (item.requireAuth && !user) {
                            return null;
                        }

                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`sub-navbar-item ${isActive ? 'active' : ''}`}
                            >
                                <span className="sub-navbar-icon">{item.icon}</span>
                                <span className="sub-navbar-label">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SubNavbar;
