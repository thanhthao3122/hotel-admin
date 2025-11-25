// src/mock/servicesUsage.js
export const MOCK_SERVICES_USAGE = [
  {
    id: 1,
    booking_id: 1,
    room_id: 1,
    service_id: 1, // Buffet sáng
    quantity: 2,
    total_price: 200000,
    created_at: '2024-04-10 08:00', // giờ gọi dịch vụ
  },
  {
    id: 2,
    booking_id: 1,
    room_id: 1,
    service_id: 2, // Giặt ủi
    quantity: 3,
    total_price: 90000,
    created_at: '2024-04-10 15:30',
  },
  {
    id: 3,
    booking_id: 2,
    room_id: 2,
    service_id: 3, // Spa
    quantity: 1,
    total_price: 400000,
    created_at: '2024-04-06 20:00',
  },
];
