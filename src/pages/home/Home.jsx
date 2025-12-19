import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/home/Navbar';
import CategoryBar from '../../components/home/CategoryBar';
import ListingCard from '../../components/home/ListingCard';
import Footer from '../../components/home/Footer';
import roomApi from '../../api/roomApi';
import socketClient from '../../services/socketClient';
import './home.css';

const Home = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchRooms = async () => {
            setLoading(true);
            try {
                // Check if we have search filters
                const guests = searchParams.get('guests');
                const checkin_date = searchParams.get('checkin_date');
                const checkout_date = searchParams.get('checkout_date');

                let response;

                // If any filter is present, use getAvailable
                if (guests || (checkin_date && checkout_date)) {
                    // Use new search API if filtering
                    const params = {};
                    if (guests) params.guests = guests;
                    if (checkin_date) params.checkin_date = checkin_date;
                    if (checkout_date) params.checkout_date = checkout_date;

                    response = await roomApi.getAvailable(params);
                }
                else {
                    // Default list
                    const filters = {};
                    response = await roomApi.getAll(1, 100, filters);
                }

                // Backend now handles filtering, so just use the data directly
                setRooms(response.data || []);
            } catch (error) {
                console.error('Error fetching rooms:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, [searchParams, refreshKey]);

    // Socket listener for real-time updates
    useEffect(() => {
        const socket = socketClient.getSocket();

        const handleBookingChange = () => {
            // Refresh the list when any booking occurs
            setRefreshKey(prev => prev + 1);
        };

        socket.on('booking_created', handleBookingChange);

        return () => {
            socket.off('booking_created', handleBookingChange);
        };
    }, []);

    return (
        <div className="landing-page">
            <div className="header-container">
                <Navbar />
            </div>

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
                                        <ListingCard key={room.room_id} room={room} />
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
