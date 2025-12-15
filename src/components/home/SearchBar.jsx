import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import './SearchBar.css';

const SearchBar = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // Hook to read URL params
    const [showGuestPicker, setShowGuestPicker] = useState(false);

    // Initialize state from URL param or default to 2
    const initialGuests = parseInt(searchParams.get('guests')) || 2;
    const [guests, setGuests] = useState(initialGuests);

    // Sync local state if URL changes (optional, but good for consistency)
    useEffect(() => {
        const urlGuests = parseInt(searchParams.get('guests'));
        if (urlGuests && urlGuests !== guests) {
            setGuests(urlGuests);
        }
    }, [searchParams]);

    const handleSearch = () => {
        // Build search params
        const params = new URLSearchParams();
        if (guests) params.append('guests', guests);

        // Navigate to home with search params
        navigate({
            pathname: '/home',
            search: params.toString()
        });
    };

    return (
        <div className="navbar-search">
            <div className="search-container">
                {/* Guest Input - Direct Number Entry */}
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
                    <span style={{ marginLeft: '8px', fontSize: '14px' }}></span>
                </div>

                {/* Search Button */}
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
