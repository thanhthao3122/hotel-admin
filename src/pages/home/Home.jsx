import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/home/Navbar';
import CategoryBar from '../../components/home/CategoryBar';
import ListingCard from '../../components/home/ListingCard';
import Footer from '../../components/home/Footer';
import roomApi from '../../api/roomApi';
import socket from '../../utils/socket';
import BookingNotification from '../../components/home/BookingNotification';
import { message } from 'antd';
import './home.css';

const Home = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedRooms, setSelectedRooms] = useState(() => {
        const saved = sessionStorage.getItem('selectedRooms');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        window.onRoomSelect = (room) => {
            setSelectedRooms(prev => {
                const isSelected = prev.some(r => r.room_id === room.room_id);
                let newList;
                if (isSelected) {
                    newList = prev.filter(r => r.room_id !== room.room_id);
                    message.info(`Đã bỏ chọn phòng ${room.room_number}`);
                } else {
                    newList = [...prev, room];
                    message.success(`Đã thêm phòng ${room.room_number} vào danh sách đặt`);
                }
                sessionStorage.setItem('selectedRooms', JSON.stringify(newList));
                // Phát sự kiện để Navbar cập nhật
                window.dispatchEvent(new Event('storage'));
                return newList;
            });
        };
        return () => { delete window.onRoomSelect; };
    }, []);

    useEffect(() => {
        const fetchRooms = async () => {
            setLoading(true);
            try {
                // Kiểm tra xem chúng ta có bộ lọc tìm kiếm không
                const guests = searchParams.get('guests');
                const checkin_date = searchParams.get('checkin_date');
                const checkout_date = searchParams.get('checkout_date');

                let response;

                // Nếu có bất kỳ bộ lọc nào, sử dụng getAvailable
                if (guests || (checkin_date && checkout_date)) {
                    // Sử dụng API tìm kiếm mới nếu đang lọc
                    const params = {};
                    if (guests) params.guests = guests;
                    if (checkin_date) params.checkin_date = checkin_date;
                    if (checkout_date) params.checkout_date = checkout_date;

                    response = await roomApi.getAvailable(params);
                }
                else {
                    // Danh sách mặc định
                    const filters = {};
                    response = await roomApi.getAll(1, 100, filters);
                }

                // Backend bây giờ xử lý việc lọc, vì vậy chỉ cần sử dụng dữ liệu trực tiếp
                setRooms(response.data || []);
            } catch (error) {
                console.error('Error fetching rooms:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, [searchParams, refreshKey]);

    // Trình lắng nghe socket cho các cập nhật thời gian thực
    useEffect(() => {

        const handleBookingChange = (data) => {
            // Làm mới danh sách khi có bất kỳ đặt phòng nào xảy ra
            setRefreshKey(prev => prev + 1);
        };

        socket.on('booking_created', handleBookingChange);
        socket.on('booking_updated', handleBookingChange);
        socket.on('room_updated', handleBookingChange);
        socket.on('room_status_updated', handleBookingChange);

        return () => {
            socket.off('booking_created', handleBookingChange);
            socket.off('booking_updated', handleBookingChange);
            socket.off('room_updated', handleBookingChange);
            socket.off('room_status_updated', handleBookingChange);
        };
    }, []);

    return (
        <div className="landing-page">
            <div className="header-container">
                <Navbar />
            </div>
            <BookingNotification />

            <main className="main-content">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        {Object.entries(rooms.reduce((acc, room) => {
                            const typeName = room.roomType?.name || 'Phòng khác';
                            if (!acc[typeName]) acc[typeName] = [];
                            acc[typeName].push(room);
                            return acc;
                        }, {})).sort().map(([typeName, typeRooms]) => (
                            <div key={typeName} className="room-category-section">
                                <h2 className="category-title">{typeName}</h2>
                                <div className="listings-grid">
                                    {typeRooms.map((room) => (
                                        <ListingCard
                                            key={room.room_id}
                                            room={room}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {rooms.length === 0 && (
                            <div className="no-results">
                                <h3>Không tìm thấy phòng phù hợp</h3>
                                <p>Vui lòng thử lại với tiêu chí tìm kiếm khác.</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Home;
