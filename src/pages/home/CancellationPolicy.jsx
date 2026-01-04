import React from 'react';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';
import './cancellationPolicy.css';
import { Typography, Breadcrumb, Collapse, Space, Divider } from 'antd';
import {
    InfoCircleOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const CancellationPolicy = () => {
    return (
        <div className="policy-page">
            <Navbar />

            <div className="policy-header">
                <div className="policy-container">
                    <Breadcrumb separator=">">
                        <Breadcrumb.Item><Link to="/home">Trang chủ</Link></Breadcrumb.Item>
                        <Breadcrumb.Item>Chính sách hủy phòng</Breadcrumb.Item>
                    </Breadcrumb>
                    <Title level={1} className="page-title">Chính sách hủy phòng & Hoàn tiền</Title>
                    <Paragraph className="header-desc">
                        Chúng tôi cam kết sự minh bạch và công bằng trong việc quản lý các đơn đặt phòng.
                        Vui lòng đọc kỹ các điều khoản dưới đây để nắm rõ quyền lợi của bạn.
                    </Paragraph>
                </div>
            </div>

            <main className="policy-container main-content">
                <section className="policy-section">
                    <div className="policy-alert">
                        <Space align="start">
                            <InfoCircleOutlined className="alert-icon" />
                            <div>
                                <Text strong>Lưu ý quan trọng: </Text>
                                <Text>Các quy định này áp dụng cho các đặt phòng tiêu chuẩn. Đối với các chương trình khuyến mãi hoặc ưu đãi đặc biệt, vui lòng kiểm tra chi tiết "Quy định đặt phòng" được đính kèm trong xác nhận của bạn.</Text>
                            </div>
                        </Space>
                    </div>

                    <div className="policy-grid">
                        <div className="policy-card highlight">
                            <CheckCircleOutlined className="card-icon success" />
                            <Title level={4}>Hoàn tiền 100%</Title>
                            <Paragraph>
                                Nếu khách hàng thực hiện hủy phòng trước <strong>48 giờ</strong> tính từ thời điểm check-in (14:00 ngày nhận phòng).
                            </Paragraph>
                        </div>
                        <div className="policy-card">
                            <ClockCircleOutlined className="card-icon warning" />
                            <Title level={4}>Hoàn tiền 50%</Title>
                            <Paragraph>
                                Nếu khách hàng thực hiện hủy phòng trong khoảng từ <strong>24 đến 48 giờ</strong> trước ngày nhận phòng.
                            </Paragraph>
                        </div>
                        <div className="policy-card danger">
                            <WarningOutlined className="card-icon error" />
                            <Title level={4}>Không hoàn tiền</Title>
                            <Paragraph>
                                Nếu khách hàng hủy phòng trong vòng <strong>24 giờ</strong> trước ngày nhận phòng hoặc không đến nhận phòng (No-show).
                            </Paragraph>
                        </div>
                    </div>
                </section>

                <Divider />

                <section className="policy-details">
                    <Title level={2}>Chi tiết quy trình hoàn tiền</Title>
                    <div className="details-list">
                        <div className="detail-item">
                            <Title level={4}>1. Phương thức hoàn tiền</Title>
                            <Paragraph>
                                Tiền hoàn lại sẽ được chuyển trả qua chính phương thức mà khách hàng đã sử dụng để thanh toán (Ví dụ: Chuyển khoản ngân hàng, VNPay, hoặc Ví điện tử).
                            </Paragraph>
                        </div>
                        <div className="detail-item">
                            <Title level={4}>2. Thời gian xử lý</Title>
                            <Paragraph>
                                Quy trình hoàn tiền thường mất từ <strong>3 đến 5 ngày làm việc</strong> để chúng tôi xác nhận và <strong>7 đến 14 ngày</strong> để ngân hàng xử lý giao dịch.
                            </Paragraph>
                        </div>
                        <div className="detail-item">
                            <Title level={4}>3. Các trường hợp bất khả kháng</Title>
                            <Paragraph>
                                Trong trường hợp thiên tai, dịch bệnh hoặc các sự cố ngoài tầm kiểm soát của cả hai bên, chúng tôi sẽ xem xét hỗ trợ bảo lưu giá trị đặt phòng hoặc hoàn tiền linh hoạt theo từng trường hợp cụ thể.
                            </Paragraph>
                        </div>
                    </div>
                </section>

                <Divider />

                <section className="faq-section">
                    <Title level={2} className="text-center"><QuestionCircleOutlined /> Câu hỏi thường gặp</Title>
                    <Collapse accordion className="custom-collapse">
                        <Panel header="Làm thế nào để tôi thực hiện hủy phòng?" key="1">
                            <Paragraph>
                                Hãy liên hệ hotline 0388065851 để được hỗ trợ nhanh nhất.
                            </Paragraph>
                        </Panel>
                        <Panel header="Tôi có thể thay đổi ngày thay vì hủy không?" key="2">
                            <Paragraph>
                                Có, chúng tôi hỗ trợ đổi ngày miễn phí nếu phòng trống vẫn còn. Vui lòng liên hệ với bộ phận CSKH ít nhất 48 giờ trước ngày nhận phòng.
                            </Paragraph>
                        </Panel>
                        <Panel header="Nếu tôi đã thanh toán bằng Voucher thì sao?" key="3">
                            <Paragraph>
                                Đối với các đặt phòng sử dụng Voucher, giá trị Voucher sẽ được khôi phục vào tài khoản của bạn (nếu còn hạn) thay vì hoàn tiền mặt.
                            </Paragraph>
                        </Panel>
                    </Collapse>
                </section>

                <div className="contact-cta">
                    <Title level={3}>Bạn vẫn còn thắc mắc?</Title>
                    <Paragraph>Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</Paragraph>
                    <Space size="large">
                        <Text strong>Hotline: 0388065851</Text>
                        <Text strong>Email: nguyen@gmail.com</Text>
                    </Space>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CancellationPolicy;
