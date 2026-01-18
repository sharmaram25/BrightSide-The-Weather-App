import React from 'react';
import { motion } from 'framer-motion';
import { WeatherData } from '../types';
import { Wind, Droplets, Eye, Gauge, Sunrise, Sunset } from 'lucide-react';

interface DetailsGridProps {
  data: WeatherData;
}

const DetailCard = ({ label, value, icon, delay }: { label: string, value: string | number, icon: React.ReactNode, delay: number }) => (
  <motion.div 
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, duration: 0.4 }}
    className="glass-panel p-5 rounded-3xl flex flex-col justify-between aspect-square md:aspect-video hover:bg-white/10 transition-colors"
  >
    <div className="flex items-center space-x-2 text-white/60 mb-2">
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-2xl md:text-3xl font-bold text-white">
      {value}
    </div>
  </motion.div>
);

const DetailsGrid: React.FC<DetailsGridProps> = ({ data }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-20 grid grid-cols-2 md:grid-cols-4 gap-4">
      <DetailCard 
        label="Humidity" 
        value={`${data.main.humidity}%`} 
        icon={<Droplets size={18} />} 
        delay={0.5} 
      />
      <DetailCard 
        label="Wind" 
        value={`${Math.round(data.wind.speed)} m/s`} 
        icon={<Wind size={18} />} 
        delay={0.6} 
      />
      <DetailCard 
        label="Pressure" 
        value={`${data.main.pressure} hPa`} 
        icon={<Gauge size={18} />} 
        delay={0.7} 
      />
      <DetailCard 
        label="Visibility" 
        value={`${(data.visibility / 1000).toFixed(1)} km`} 
        icon={<Eye size={18} />} 
        delay={0.8} 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="col-span-2 glass-panel p-5 rounded-3xl flex items-center justify-between"
      >
         <div className="flex flex-col items-center w-1/2">
            <Sunrise size={24} className="text-yellow-300 mb-2" />
            <span className="text-white/60 text-xs uppercase font-bold">Sunrise</span>
            <span className="text-xl font-bold">{formatTime(data.sys.sunrise)}</span>
         </div>
         <div className="h-10 w-px bg-white/20"></div>
         <div className="flex flex-col items-center w-1/2">
            <Sunset size={24} className="text-orange-300 mb-2" />
            <span className="text-white/60 text-xs uppercase font-bold">Sunset</span>
            <span className="text-xl font-bold">{formatTime(data.sys.sunset)}</span>
         </div>
      </motion.div>

       <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        className="col-span-2 glass-panel p-5 rounded-3xl flex flex-col justify-center"
      >
          <span className="text-white/60 text-xs uppercase font-bold mb-1">Feels Like</span>
          <span className="text-3xl font-bold">{Math.round(data.main.feels_like)}°</span>
          <p className="text-xs text-white/50 mt-2">
            {data.main.feels_like < data.main.temp ? "Cooler due to wind chill" : "Warmer due to humidity"}
          </p>
      </motion.div>
    </div>
  );
};

export default DetailsGrid;