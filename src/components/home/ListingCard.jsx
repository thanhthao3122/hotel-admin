import { Link } from 'react-router-dom';

import { BASE_URL } from './constants';

// Helper function to format currency in VND
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(Math.floor(amount));
};

const ListingCard = ({ room }) => {
    // Use placeholder image if no image provided
    let image = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80';

    if (room.image) {
        if (room.image.startsWith('http')) {
            image = room.image;
        } else {
            image = `${BASE_URL}${room.image}`;
        }
    }

    return (
        <Link to={`/room/${room.room_id}`} className="listing-card">
            <div className="listing-image-container">
                <img src={image} alt={room.room_number} className="listing-image" />
                <button className="favorite-button">
                    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', fill: 'rgba(0, 0, 0, 0.5)', height: '24px', width: '24px', stroke: 'white', strokeWidth: 2, overflow: 'visible' }}>
                        <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"></path>
                    </svg>
                </button>
            </div>
            <div className="listing-details">
                <div className="listing-header">
                    <h3 className="listing-title">{room.room_type_name || `Phòng ${room.room_number}`}</h3>
                    <div className="listing-rating">
                        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '12px', width: '12px', fill: 'currentcolor' }}>
                            <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.54 1.736l7.293 6.815-1.991 9.692a1 1 0 0 0 1.488 1.081L16 24.248l8.64 4.808a1 1 0 0 0 1.488-1.08l-1.991-9.692 7.293-6.815a1 1 0 0 0-.54-1.736l-9.86-1.27-4.124-8.885a1 1 0 0 0-1.798 0z"></path>
                        </svg>
                        <span>4.8</span>
                    </div>
                </div>
                <div className="listing-price">
                    <span className="price-amount">{formatCurrency(room.roomType?.base_price || room.price_per_night)}đ</span>
                    <span className="price-period"> đêm</span>
                </div>
            </div>
        </Link>
    );
};

export default ListingCard;
