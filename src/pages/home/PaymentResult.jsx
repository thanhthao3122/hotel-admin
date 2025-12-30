import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const responseCode = searchParams.get('code');

    useEffect(() => {
        // Giả lập loading để tăng trải nghiệm người dùng
        setTimeout(() => setLoading(false), 1000);
    }, []);

    const isSuccess = responseCode === '00';

    const resultConfig = {
        '00': {
            status: 'success',
            title: 'Thanh toán thành công!',
            subTitle: 'Cảm ơn bạn đã thanh toán. Booking của bạn đã được xác nhận.',
            icon: <CheckCircleOutlined style={{ fontSize: 72, color: '#52c41a' }} />
        },
        '07': {
            status: 'warning',
            title: 'Giao dịch đang được xử lý',
            subTitle: 'Vui lòng kiểm tra lại sau ít phút.',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#faad14' }} />
        },
        '09': {
            status: 'error',
            title: 'Giao dịch thất bại',
            subTitle: 'Thẻ/Tài khoản của bạn chưa đăng ký dịch vụ InternetBanking.',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />
        },
        '10': {
            status: 'error',
            title: 'Giao dịch thất bại',
            subTitle: 'Bạn đã xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />
        },
        '11': {
            status: 'error',
            title: 'Giao dịch thất bại',
            subTitle: 'Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />
        },
        '12': {
            status: 'error',
            title: 'Giao dịch thất bại',
            subTitle: 'Thẻ/Tài khoản của bạn bị khóa.',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />
        },
        '13': {
            status: 'error',
            title: 'Giao dịch thất bại',
            subTitle: 'Bạn đã nhập sai mật khẩu xác thực giao dịch (OTP).',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />
        },
        '24': {
            status: 'error',
            title: 'Giao dịch bị hủy',
            subTitle: 'Bạn đã hủy giao dịch.',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />
        },
        '51': {
            status: 'error',
            title: 'Giao dịch thất bại',
            subTitle: 'Tài khoản của bạn không đủ số dư để thực hiện giao dịch.',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />
        },
        '65': {
            status: 'error',
            title: 'Giao dịch thất bại',
            subTitle: 'Tài khoản của bạn đã vượt quá hạn mức giao dịch trong ngày.',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />
        },
        '75': {
            status: 'error',
            title: 'Ngân hàng đang bảo trì',
            subTitle: 'Ngân hàng thanh toán đang bảo trì. Vui lòng thử lại sau.',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />
        },
        '79': {
            status: 'error',
            title: 'Giao dịch thất bại',
            subTitle: 'Bạn đã nhập sai mật khẩu thanh toán quá số lần quy định.',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />
        },
        'default': {
            status: 'error',
            title: 'Thanh toán thất bại',
            subTitle: 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại sau.',
            icon: <CloseCircleOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />
        }
    };

    const config = resultConfig[responseCode] || resultConfig['default'];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '200px 20px' }}>
                <Spin size="large" />
                <p style={{ marginTop: '20px', fontSize: '16px' }}>Đang xử lý kết quả thanh toán...</p>
            </div>
        );
    }

    return (
        <div className="landing-page">
            <div className="header-container">
                <Navbar />
            </div>

            <main className="main-content" style={{ paddingTop: '100px', padding: '100px 20px 40px', minHeight: '60vh' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <Result
                        status={config.status}
                        title={config.title}
                        subTitle={config.subTitle}
                        icon={config.icon}
                        extra={[
                            <Button type="primary" key="history" onClick={() => navigate('/booking-history')}>
                                Xem lịch sử đặt phòng
                            </Button>,
                            !isSuccess && (
                                <Button key="retry" onClick={() => navigate('/booking-history')}>
                                    Thử lại
                                </Button>
                            ),
                            <Button key="home" onClick={() => navigate('/home')}>
                                Về trang chủ
                            </Button>
                        ]}
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PaymentResult;
