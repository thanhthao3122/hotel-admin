import { Tag, Tooltip } from 'antd';
import { CopyOutlined, GiftOutlined } from '@ant-design/icons';
import { message } from 'antd';
import './voucherBar.css';

const VoucherBar = ({ vouchers = [] }) => {

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    message.success(`Đã sao chép mã ${code}`);
  };

  if (!vouchers.length) return null;

  return (
    <div className="voucher-bar">
      <GiftOutlined className="voucher-icon" />
      <span className="voucher-title">Ưu đãi:</span>

      <div className="voucher-list">
        {vouchers.map(v => (
          <Tooltip title="Click để sao chép" key={v.code}>
            <Tag
              color="gold"
              className="voucher-tag"
              onClick={() => handleCopy(v.code)}
            >
              {v.code} - {v.discount_type === 'percentage' ? `${parseFloat(v.discount_value)}%` : new Intl.NumberFormat('vi-VN').format(v.discount_value) + ' VNĐ'}
              <CopyOutlined className="copy-icon" />
            </Tag>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

export default VoucherBar;
