import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, BookOpenIcon } from '@heroicons/react/outline';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <p className="not-found-message">ไม่พบหน้าที่คุณค้นหา</p>
        <p className="not-found-description">
          อุ๊ปส์! ดูเหมือนว่าหน้าที่คุณพยายามเข้าถึงไม่มีอยู่ 
          อาจจะถูกย้ายหรือลบไปแล้ว
        </p>
        <div className="not-found-actions">
          <Link to="/" className="not-found-button home-button">
            <HomeIcon className="icon" />
            กลับหน้าแรก
          </Link>
          <Link to="/books" className="not-found-button books-button">
            <BookOpenIcon className="icon" />
            ดูหนังสือทั้งหมด
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;