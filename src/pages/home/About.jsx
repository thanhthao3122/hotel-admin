import React from 'react';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';
import './about.css';
import { Typography, Row, Col, Card, Statistic, Divider } from 'antd';
import {
    GlobalOutlined,
    HeartOutlined,
    SafetyCertificateOutlined,
    TeamOutlined,
    RocketOutlined,
    EyeOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const About = () => {
    return (
        <div className="about-page">
            <Navbar />

            {/* Hero Section */}
            <section className="about-hero">
                <div className="hero-overlay">
                    <div className="hero-content">
                        <Title level={1} className="hero-title">Sứ mệnh của chúng tôi: Giúp mọi người trải nghiệm thế giới dễ dàng hơn</Title>
                        <Paragraph className="hero-subtitle">
                            Tại BOOKING Hotel, chúng tôi tin rằng du lịch là sức mạnh hướng thiện,
                            giúp mở rộng tầm nhìn và tăng cường sự thấu hiểu giữa các nền văn hóa.
                        </Paragraph>
                    </div>
                </div>
            </section>

            <main className="about-container">
                {/* Statistics Section */}
                <section className="stats-section">
                    <Row gutter={[32, 32]} justify="center">
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Đối tác toàn cầu" value={28000000} suffix="+" />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Khách hàng phục vụ" value={100} suffix=" triệu+" />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="stat-card">
                                <Statistic title="Quốc gia & Vùng lãnh thổ" value={220} suffix="+" />
                            </Card>
                        </Col>
                    </Row>
                </section>

                <Divider />

                {/* Our Story Section */}
                <section className="story-section">
                    <Row gutter={[48, 48]} align="middle">
                        <Col xs={24} md={12}>
                            <div className="story-text">
                                <Title level={2}>Câu chuyện của chúng tôi</Title>
                                <Paragraph>
                                    Được thành lập từ năm 2010 tại Hà Nội, BOOKING Hotel đã phát triển từ một startup nhỏ thành
                                    một trong những công ty thương mại điện tử du lịch hàng đầu Việt Nam.
                                </Paragraph>
                                <Paragraph>
                                    Chúng tôi không ngừng đổi mới công nghệ để loại bỏ những rào cản trong việc du lịch,
                                    kết nối hàng triệu khách du lịch với những trải nghiệm đáng nhớ, nhiều lựa chọn vận chuyển
                                    và những chỗ nghỉ tuyệt vời.
                                </Paragraph>
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            <div className="story-image">
                                <img
                                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
                                    alt="Our Office"
                                    className="img-fluid rounded-lg shadow-lg"
                                />
                            </div>
                        </Col>
                    </Row>
                </section>

                <Divider />

                {/* Core Values Section */}
                <section className="values-section">
                    <Title level={2} style={{ textAlign: 'center', marginBottom: '48px' }}>Giá trị cốt lõi của chúng tôi</Title>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} sm={12} lg={6}>
                            <div className="value-item">
                                <div className="value-icon"><SafetyCertificateOutlined /></div>
                                <Title level={4}>Tin cậy & An toàn</Title>
                                <Text>Chúng tôi đặt sự an toàn và tin tưởng của khách hàng lên hàng đầu trong mọi giao dịch.</Text>
                            </div>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <div className="value-item">
                                <div className="value-icon"><GlobalOutlined /></div>
                                <Title level={4}>Tiếp cận Toàn cầu</Title>
                                <Text>Mang thế giới đến gần bạn hơn với sự kết nối không biên giới.</Text>
                            </div>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <div className="value-item">
                                <div className="value-icon"><HeartOutlined /></div>
                                <Title level={4}>Tận tâm Phục vụ</Title>
                                <Text>Đội ngũ hỗ trợ 24/7 luôn sẵn sàng đồng hành cùng bạn trên mọi hành trình.</Text>
                            </div>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <div className="value-item">
                                <div className="value-icon"><TeamOutlined /></div>
                                <Title level={4}>Gắn kết Cộng đồng</Title>
                                <Text>Xây dựng cộng đồng du lịch văn minh, bền vững và đầy cảm hứng.</Text>
                            </div>
                        </Col>
                    </Row>
                </section>

                <Divider />

                {/* Commitment Section */}
                <section className="commitment-section">
                    <div className="commitment-card">
                        <Row gutter={[32, 32]} align="middle">
                            <Col xs={24} md={16}>
                                <Title level={3} style={{ color: 'white' }}>Cam kết bền vững</Title>
                                <Paragraph style={{ color: 'rgba(255,255,255,0.85)' }}>
                                    Chúng tôi tin rằng việc du lịch bền vững là trách nhiệm của tất cả chúng ta.
                                    BOOKING Hotel đang nỗ lực giảm thiểu tác động môi trường và hỗ trợ các cộng đồng địa phương
                                    thông qua các hành động thiết thực.
                                </Paragraph>
                            </Col>
                            <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                                <RocketOutlined style={{ fontSize: '64px', color: '#ffd700' }} />
                            </Col>
                        </Row>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default About;
