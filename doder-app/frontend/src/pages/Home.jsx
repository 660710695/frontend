import React from 'react';
import { Link } from 'react-router-dom';
import FeaturedMovies from '../components/FeaturedMovies';
// import './Home.css';
import '../styles/Home.css';

const Home = () => {
  const categories = [
    { name: 'Action', icon: '🎬', slug: 'action' },
    { name: 'Drama', icon: '🎭', slug: 'drama' },
    { name: 'Comedy', icon: '😂', slug: 'comedy' },
    { name: 'Animation', icon: '🧸', slug: 'animation' },
    { name: 'Horror', icon: '👻', slug: 'horror' },
  ];

  return (
    <div className="home-root">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-content">
            <h1 className="hero-title">
              ยินดีต้อนรับสู่ <span className="highlight">Doder Cinema</span>
            </h1>
            <p className="hero-sub">
              จองที่นั่ง เช็ครอบฉาย และค้นหาหนังโปรด — ง่ายในคลิกเดียว
            </p>

            <div className="hero-actions">
              <Link to="/movies" className="btn btn-primary">
                ดูหนังตอนนี้ <span className="arrow">→</span>
              </Link>
              <Link to="/theaters" className="btn btn-outline">
                เลือกโรงภาพยนตร์
              </Link>
            </div>
          </div>

          <div className="hero-aside" aria-hidden>
            {/* สำรองไว้สำหรับภาพโปสเตอร์หรือแบนเนอร์ */}
          </div>
        </div>

        <div className="hero-wave" aria-hidden>
          <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="#0f172a"/>
          </svg>
        </div>
      </section>

      <section className="featured-section">
        <div className="container">
          <h2 className="section-title">หนังแนะนำ</h2>
          <FeaturedMovies />
          <div className="view-all">
            <Link to="/movies" className="view-all-link">
              ดูหนังทั้งหมด <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="categories-section">
        <div className="container">
          <h3 className="section-title small">หมวดหมู่ยอดนิยม</h3>
          <div className="categories-grid">
            {categories.map(cat => (
              <Link key={cat.slug} to={`/movies/genre/${cat.slug}`} className="category-card">
                <div className="cat-icon">{cat.icon}</div>
                <div className="cat-name">{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
