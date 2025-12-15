import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const fetchRooms = async () => {
            setLoading(true);
            try {
                // Check if we have search filters
                const guests = searchParams.get('guests');

                let response;

                if (guests) {
                    // Use new search API if filtering
                    const searchParams = { guests };
                    response = await roomApi.getAvailable(searchParams);
                } else {
                    // Default list
                    const filters = { status: 'available' };
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
    }, [searchParams]);

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
