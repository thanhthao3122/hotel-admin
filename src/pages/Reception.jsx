import { Typography, Empty } from 'antd';

const { Title } = Typography;

const Reception = () => {
    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Lễ tân</Title>
            </div>
            <Empty description="Chức năng Check-in / Check-out đã được thu hồi" />
        </div>
    );
};

export default Reception;
