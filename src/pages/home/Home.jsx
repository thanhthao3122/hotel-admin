import { useState, useEffect } from 'react';
import Navbar from '../../components/home/Navbar';
import SubNavbar from '../../components/home/SubNavbar';
import CategoryBar from '../../components/home/CategoryBar';
import ListingCard from '../../components/home/ListingCard';
import Footer from '../../components/home/Footer';
import roomApi from '../../api/roomApi';
import './home.css';

const Home = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await roomApi.getAll(1, 100);
                // Filter only available rooms
                const availableRooms = (response.data || []).filter(
                    room => room.status === 'available'
                );
                setRooms(availableRooms);
            } catch (error) {
                console.error('Error fetching rooms:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    return (
        <div className="landing-page">
            <div className="header-container">
                <Navbar />
                <SubNavbar />
            </div>

            <main className="main-content">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="listings-grid">
                        {rooms.map((room) => (
                            <ListingCard key={room.room_id} room={room} />
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Home;
