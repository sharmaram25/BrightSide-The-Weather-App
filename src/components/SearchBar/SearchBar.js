import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SearchBar.css';

// Popular cities for auto-suggestions
const POPULAR_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 
  'Kolkata', 'Pune', 'Jaipur', 'Ahmedabad', 'Surat'
];

const SearchBar = ({ onSearch }) => {
  const [city, setCity] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (city.trim().length > 1) {
      const filteredSuggestions = POPULAR_CITIES.filter(
        item => item.toLowerCase().includes(city.toLowerCase())
      );
      setSuggestions(filteredSuggestions.slice(0, 5));
      setShowSuggestions(filteredSuggestions.length > 0 && isFocused);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [city, isFocused]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim()) {
      onSearch(city.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setCity(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <motion.div 
      className="search-container"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >      <motion.form 
        onSubmit={handleSubmit}
        className={`search-form ${isFocused ? 'focused' : ''}`}
        animate={{ 
          boxShadow: isFocused 
            ? '0 15px 30px rgba(0, 0, 0, 0.15), 0 0 20px rgba(94, 114, 228, 0.3)' 
            : '0 8px 20px rgba(0, 0, 0, 0.1)'
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="search-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          type="text"
          className="input-field search-input"
          placeholder="Type a city name and press Enter..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && city.trim()) {
              e.preventDefault();
              onSearch(city.trim());
              setShowSuggestions(false);
            }
          }}
          onBlur={() => {
            // Delay to allow suggestion click to work
            setTimeout(() => setIsFocused(false), 150);
          }}
        />
      </motion.form>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div 
            className="suggestions-container"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {suggestion}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="search-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <p>Enter a city name to check the current weather conditions</p>
      </motion.div>
    </motion.div>
  );
};

export default SearchBar;
