// src/mock/roomTypes.js

export const MOCK_ROOM_TYPES = [
  {
    room_type_id: 1,
    name: 'Standard',
    capacity: 2,
    base_price: 500000,
    description: 'Phòng tiêu chuẩn, 1 giường đôi, view phố',
    is_active: 1, // 1 = hiện, 0 = ẩn
  },
  {
    room_type_id: 2,
    name: 'Deluxe',
    capacity: 3,
    base_price: 800000,
    description: 'Phòng deluxe, giường lớn, có ban công',
    is_active: 1,
  },
  {
    room_type_id: 3,
    name: 'Suite',
    capacity: 4,
    base_price: 1500000,
    description: 'Suite cao cấp, phòng khách riêng',
    is_active: 1,
  },
  {
    room_type_id: 4,
    name: 'Economy',
    capacity: 2,
    base_price: 400000,
    description: 'Phòng nhỏ, giá rẻ, phù hợp tiết kiệm',
    is_active: 0,
  },
];




