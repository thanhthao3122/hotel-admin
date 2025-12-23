import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './register.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        id_card: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu không khớp');
            return;
        }

        setLoading(true);

        try {
            // Call register API
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone,
                    id_card: formData.id_card,
                    password: formData.password,
                    role: 'user' // New users are always 'user' role
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng ký thất bại');
            }

            // Save user info and token to localStorage (Auto-login)
            localStorage.setItem('user', JSON.stringify(data.data.user));
            localStorage.setItem('token', data.data.token);

            // Navigate to home page
            navigate('/home');
        } catch (error) {
            setError(error.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };


    const handleGoogleSignIn = () => {
        // TODO: Implement Google OAuth
        console.log('Google sign in clicked');
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-header">
                    <h1>Tạo tài khoản</h1>
                    <p>Chào mừng bạn đến với hệ thống đặt phòng</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-group">
                        <label htmlFor="full_name">Họ và tên</label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Nhập họ và tên"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="example@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Số điện thoại *</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="0123456789"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="id_card">Số CCCD/CMND</label>
                        <input
                            type="text"
                            id="id_card"
                            name="id_card"
                            value={formData.id_card}
                            onChange={handleChange}
                            placeholder="Nhập số CCCD/CMND (không bắt buộc)"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Tối thiểu 6 ký tự"
                            required
                            minLength="6"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Nhập lại mật khẩu"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Đăng ký'}
                    </button>
                </form>

                <div className="divider">
                    <span>Hoặc</span>
                </div>

                <button onClick={handleGoogleSignIn} className="btn-google">
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                        <g fill="none" fillRule="evenodd">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853" />
                            <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335" />
                        </g>
                    </svg>
                    Đăng ký với Google
                </button>

                <div className="register-footer">
                    <p>
                        Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
