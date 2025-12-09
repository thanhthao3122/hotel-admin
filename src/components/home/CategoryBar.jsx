import { useState } from 'react';

const categories = [
    { id: 1, label: 'Thật ấn tượng', icon: 'https://a0.muscache.com/pictures/c5a4f6fc-c92c-4ae8-87dd-57f1ff1b89a6.jpg' },
    { id: 2, label: 'Công viên quốc gia', icon: 'https://a0.muscache.com/pictures/c0a24c04-ce1f-490c-833f-987613930eca.jpg' },
    { id: 3, label: 'Nhà nhỏ', icon: 'https://a0.muscache.com/pictures/35919456-df89-4024-ad50-5ceb7a47079d.jpg' },
    { id: 4, label: 'Đảo', icon: 'https://a0.muscache.com/pictures/8e507f16-7b43-49c9-be78-2ff1e4e65217.jpg' },
    { id: 5, label: 'Bãi biển', icon: 'https://a0.muscache.com/pictures/10ce1091-c854-40f3-a2fb-defc2995bcaf.jpg' },
    { id: 6, label: 'Hồ bơi tuyệt vời', icon: 'https://a0.muscache.com/pictures/3fb523a0-b622-4368-8142-b5e03df7549b.jpg' },
    { id: 7, label: 'Bắc cực', icon: 'https://a0.muscache.com/pictures/8b44f770-7156-4c7b-b4a0-d4021c12230c.jpg' },
    { id: 8, label: 'Thiết kế', icon: 'https://a0.muscache.com/pictures/50861fca-582c-4bcc-89d3-857fb7ca6528.jpg' },
    { id: 9, label: 'Lướt sóng', icon: 'https://a0.muscache.com/pictures/957f8022-dfd7-426c-99fd-77bb792e8d7a.jpg' },
    { id: 10, label: 'Nhà trên cây', icon: 'https://a0.muscache.com/pictures/4d4a4eba-c7e4-43eb-9ce2-95e1d200d10e.jpg' },
];

const CategoryBar = () => {
    const [activeCategory, setActiveCategory] = useState(1);

    return (
        <div className="category-bar">
            <div className="category-container">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className={`category-item ${activeCategory === category.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(category.id)}
                    >
                        <img src={category.icon} alt={category.label} className="category-icon" />
                        <span className="category-label">{category.label}</span>
                    </div>
                ))}
            </div>
            <div className="filter-button">
                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '14px', width: '14px', fill: 'currentcolor' }}>
                    <path d="M5 8c1.306 0 2.418.835 2.83 2H14v2H7.829A3.001 3.001 0 1 1 5 8zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6-8a3 3 0 1 1-2.829 4H2V4h6.17A3.001 3.001 0 0 1 11 2zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path>
                </svg>
                <span>Bộ lọc</span>
            </div>
        </div>
    );
};

export default CategoryBar;
