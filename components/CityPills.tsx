import React from 'react';
import { motion } from 'framer-motion';
import { Place } from '../lib/model';
import { tap } from '../lib/haptics';

interface CityPillsProps {
  onSelect: (place: Place) => void;
  exclude?: string[];
}

const CITIES: Place[] = [
  { id: 'mumbai-in', name: 'Mumbai', region: 'Maharashtra', country: 'IN', lat: 19.076, lon: 72.8777 },
  { id: 'delhi-in', name: 'Delhi', region: 'Delhi', country: 'IN', lat: 28.6139, lon: 77.209 },
  { id: 'bengaluru-in', name: 'Bengaluru', region: 'Karnataka', country: 'IN', lat: 12.9716, lon: 77.5946 },
  { id: 'hyderabad-in', name: 'Hyderabad', region: 'Telangana', country: 'IN', lat: 17.385, lon: 78.4867 },
  { id: 'chennai-in', name: 'Chennai', region: 'Tamil Nadu', country: 'IN', lat: 13.0827, lon: 80.2707 },
  { id: 'kolkata-in', name: 'Kolkata', region: 'West Bengal', country: 'IN', lat: 22.5726, lon: 88.3639 },
  { id: 'pune-in', name: 'Pune', region: 'Maharashtra', country: 'IN', lat: 18.5204, lon: 73.8567 },
  { id: 'jaipur-in', name: 'Jaipur', region: 'Rajasthan', country: 'IN', lat: 26.9124, lon: 75.7873 },
  { id: 'goa-in', name: 'Goa', region: 'Goa', country: 'IN', lat: 15.4909, lon: 73.8278 },
  { id: 'shimla-in', name: 'Shimla', region: 'Himachal Pradesh', country: 'IN', lat: 31.1048, lon: 77.1734 },
];

const CityPills: React.FC<CityPillsProps> = ({ onSelect, exclude = [] }) => {
  const list = CITIES.filter((c) => !exclude.includes(c.id));
  if (!list.length) return null;
  return (
    <div>
      <div className="label mb-2.5">Popular</div>
      <div className="flex flex-wrap gap-2">
        {list.map((city, i) => (
          <motion.button
            key={city.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.025 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              tap();
              onSelect(city);
            }}
            className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[14px] font-medium text-white/85 active:bg-white/15"
          >
            {city.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CityPills;
