import React from 'react';
import { motion } from 'framer-motion';

interface CityPillsProps {
  onSelect: (city: string) => void;
}

const CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Jaipur',
  'Goa',
  'Shimla'
];

const CityPills: React.FC<CityPillsProps> = ({ onSelect }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-4xl mx-auto mt-6 mb-2 overflow-x-auto scrollbar-hide py-2"
    >
      <div className="flex space-x-3 px-4 md:justify-center min-w-max">
        {CITIES.map((city, index) => (
          <button
            key={city}
            onClick={() => onSelect(city)}
            className="glass-pill px-5 py-2 rounded-full text-sm font-medium text-white/90 whitespace-nowrap active:scale-95 transition-transform"
          >
            {city}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default CityPills;