import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // Hook để đọc tham số URL
    const [showGuestPicker, setShowGuestPicker] = useState(false);

    // Khởi tạo state từ URL
    const initialGuests = parseInt(searchParams.get('guests')) || 2;
    const initialCheckin = searchParams.get('checkin_date') || '';
    const initialCheckout = searchParams.get('checkout_date') || '';

    const [guests, setGuests] = useState(initialGuests);
    const [checkinDate, setCheckinDate] = useState(initialCheckin);
    const [checkoutDate, setCheckoutDate] = useState(initialCheckout);

    // Đồng bộ state cục bộ nếu URL thay đổi
    useEffect(() => {
        const urlGuests = parseInt(searchParams.get('guests'));
        const urlCheckin = searchParams.get('checkin_date');
        const urlCheckout = searchParams.get('checkout_date');

        if (urlGuests && urlGuests !== guests) setGuests(urlGuests);
        if (urlCheckin !== checkinDate) setCheckinDate(urlCheckin || '');
        if (urlCheckout !== checkoutDate) setCheckoutDate(urlCheckout || '');
    }, [searchParams]);

    const handleSearch = () => {
        // Kiểm tra hợp lệ
        if (checkinDate && checkoutDate) {
            const start = new Date(checkinDate);
            const end = new Date(checkoutDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (start < today) {
                // message.error yêu cầu import 'antd', dùng alert tạm nếu thiếu
                // Lý tưởng nhất là thêm import message từ 'antd' ở trên cùng
                alert('Ngày nhận phòng không thể trong quá khứ');
                return;
            }

            if (end <= start) {
                alert('Ngày trả phòng phải sau ngày nhận phòng');
                return;
            }
        }

        // Xây dựng tham số tìm kiếm
        const params = new URLSearchParams();
        if (guests) params.append('guests', guests);
        if (checkinDate) params.append('checkin_date', checkinDate);
        if (checkoutDate) params.append('checkout_date', checkoutDate);

        // Điều hướng về trang chủ với tham số tìm kiếm
        navigate({
            pathname: '/home',
            search: params.toString()
        });
    };

    return (
        <div className="navbar-search">
            <div className="search-container">
                {/* Nhập ngày */}
                <div className="search-field date-field" style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
                    <label className="search-label" style={{ marginRight: '5px', marginBottom: 0, whiteSpace: 'nowrap' }}>
                        Ngày nhận
                    </label>
                    <input
                        type="date"
                        className="search-input"
                        value={checkinDate}
                        onChange={(e) => setCheckinDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        style={{
                            border: '1px solid #ddd',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}
                    />
                </div>

                <div className="search-field date-field" style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
                    <label className="search-label" style={{ marginRight: '5px', marginBottom: 0, whiteSpace: 'nowrap' }}>
                        Ngày trả
                    </label>
                    <input
                        type="date"
                        className="search-input"
                        value={checkoutDate}
                        onChange={(e) => setCheckoutDate(e.target.value)}
                        min={checkinDate || new Date().toISOString().split('T')[0]}
                        style={{
                            border: '1px solid #ddd',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}
                    />
                </div>

                {/* Nhập số người - Nhập số trực tiếp */}
                <div className="search-field single-field" style={{ display: 'flex', alignItems: 'center' }}>
                    <label className="search-label" style={{ marginRight: '10px', marginBottom: 0, whiteSpace: 'nowrap' }}>
                        Số người
                    </label>

                    <input
                        type="number"
                        min="1"
                        max="10"
                        className="search-input"
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                            border: '1px solid #ddd',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            width: '60px',
                            textAlign: 'center'
                        }}
                    />
                </div>

                {/* Nút tìm kiếm */}
                <button className="search-icon-button" onClick={handleSearch}>
                    <svg
                        viewBox="0 0 32 32"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        role="presentation"
                        focusable="false"
                        style={{
                            display: 'block',
                            fill: 'none',
                            height: '12px',
                            width: '12px',
                            stroke: 'white',
                            strokeWidth: 5.33333,
                            overflow: 'visible',
                        }}
                    >
                        <g fill="none">
                            <path d="m13 24c6.0751322 0 11-4.9248678 11-11 0-6.07513225-4.9248678-11-11-11-6.07513225 0-11 4.92486775-11 11 0 6.0751322 4.92486775 11 11 11zm8-3 9 9"></path>
                        </g>
                    </svg>
                </button>
            </div>
        </div>
    );
};
export default SearchBar;
