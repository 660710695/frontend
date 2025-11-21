// จะใช้หรือไม่ใช้ก็ได้
import React, { useState } from 'react';
import { SearchIcon } from '@heroicons/react/outline';
import './SearchBar.css';

export default function SearchBar({ onSearch, placeholder = 'ค้นหาหนัง...' }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm.trim());
  };

  return (
    <form className="search-form" onSubmit={handleSubmit} role="search">
      <div className="search-wrapper">
        <label htmlFor="movie-search" className="sr-only">ค้นหา</label>
        <SearchIcon className="search-icon" aria-hidden="true" />
        <input
          id="movie-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          aria-label="ค้นหาหนัง"
        />
        <button type="submit" className="search-btn">ค้นหา</button>
      </div>
    </form>
  );
}