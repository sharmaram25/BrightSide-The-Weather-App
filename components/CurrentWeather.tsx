import React from 'react';
import { motion } from 'framer-motion';
import { WeatherData } from '../types';
import { MapPin, ArrowUp, ArrowDown } from 'lucide-react';

interface CurrentWeatherProps {
  data: WeatherData;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data }) => {
  const { main, weather, name, sys } = data;
  const currentTemp = Math.round(main.temp);
  const condition = weather[0].description;
  const high = Math.round(main.temp_max);
  const low = Math.round(main.temp_min);

  return (
    <div className="flex flex-col items-center justify-center py-4 md:py-8 text-white text-center relative mb-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-2 mb-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors cursor-default"
      >
        <MapPin size={14} className="text-white/80" />
        <span className="text-xs font-bold tracking-widest uppercase text-white/90">{name}, {sys.country}</span>
      </motion.div>

      <motion.div
        key={currentTemp} 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative"
      >
        <h1 className="text-[8rem] md:text-[10rem] lg:text-[12rem] font-bold tracking-tighter text-shadow leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          {currentTemp}°
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center mt-2"
      >
        <p className="text-xl md:text-2xl font-light capitalize opacity-90 mb-4 tracking-wide">{condition}</p>
        
        <div className="flex items-center space-x-8 text-base md:text-lg font-medium bg-black/10 px-6 py-2 rounded-2xl backdrop-blur-sm border border-white/5">
          <div className="flex items-center space-x-1.5">
            <div className="p-1 rounded-full bg-red-500/20">
                <ArrowUp size={14} className="text-red-300" />
            </div>
            <span>{high}°</span>
          </div>
          <div className="w-px h-4 bg-white/20"></div>
          <div className="flex items-center space-x-1.5">
             <div className="p-1 rounded-full bg-blue-500/20">
                <ArrowDown size={14} className="text-blue-300" />
             </div>
            <span>{low}°</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CurrentWeather;