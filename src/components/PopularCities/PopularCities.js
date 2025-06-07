import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { popularCities } from '../../utils/weatherAPI';
import './PopularCities.css';

// Icons for cities
const cityIcons = {
  Mumbai: "🌇",
  Delhi: "🏙️",
  Bangalore: "🌆",
  Hyderabad: "🌉",
  Chennai: "🌅",
  Kolkata: "🌃",
  Pune: "🏙️",
  Jaipur: "🏰",
  Ahmedabad: "🌆",
  Lucknow: "🏛️"
};

const PopularCities = ({ onSelectCity }) => {
  const [hoveredCity, setHoveredCity] = useState(null);
  
  return (
    <motion.div 
      className="popular-cities"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <motion.h3
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Popular Cities in India
      </motion.h3>
      
      <motion.div 
        className="city-chips-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="city-chips">
          {popularCities.map((city, index) => (
            <motion.div
              key={city}
              className={`city-chip glass-card ${hoveredCity === city ? 'active' : ''}`}
              onClick={() => onSelectCity(city)}
              onMouseEnter={() => setHoveredCity(city)}
              onMouseLeave={() => setHoveredCity(null)}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                boxShadow: hoveredCity === city 
                  ? '0 15px 30px rgba(0, 0, 0, 0.2), 0 0 15px rgba(94, 114, 228, 0.3)' 
                  : '0 8px 15px rgba(0, 0, 0, 0.1)'
              }}
              transition={{ 
                delay: 0.1 * index, 
                duration: 0.4,
                type: 'spring',
                stiffness: 300
              }}
              whileHover={{ 
                scale: 1.08, 
                y: -8,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="city-icon">{cityIcons[city]}</span>
              <span className="city-name">{city}</span>
              
              <AnimatePresence>
                {hoveredCity === city && (
                  <motion.div 
                    className="city-highlight"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        
        <div className="cities-hint">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            Click on a city to get current weather conditions
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PopularCities;
