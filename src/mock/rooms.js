// src/mock/rooms.js
export const MOCK_ROOMS = [
  {
    room_id: 1,
    room_number: '101',
    floor: 1,
    room_type_id: 1, // Standard
    status: 'AVAILABLE',
  },
  {
    room_id: 2,
    room_number: '102',
    floor: 1,
    room_type_id: 2, // Deluxe
    status: 'BOOKED',
  },
  {
    room_id: 3,
    room_number: '201',
    floor: 2,
    room_type_id: 3, // Suite
    status: 'OCCUPIED',
  },
  {
    room_id: 4,
    room_number: '202',
    floor: 2,
    room_type_id: 1, // Standard
    status: 'CLEANING',
  },
];
