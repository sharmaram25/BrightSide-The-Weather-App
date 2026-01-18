import React from 'react';
import { motion } from 'framer-motion';
import { ForecastData } from '../types';
import { Cloud, CloudRain, Sun, CloudSnow, CloudLightning, CloudDrizzle, Moon } from 'lucide-react';

interface ForecastProps {
  data: ForecastData;
}

const getWeatherIcon = (condition: string, isNight: boolean) => {
  const c = condition.toLowerCase();
  if (c.includes('thunder')) return <CloudLightning className="text-yellow-400" />;
  if (c.includes('drizzle')) return <CloudDrizzle className="text-blue-300" />;
  if (c.includes('rain')) return <CloudRain className="text-blue-400" />;
  if (c.includes('snow')) return <CloudSnow className="text-white" />;
  if (c.includes('cloud')) return <Cloud className="text-gray-300" />;
  if (isNight) return <Moon className="text-yellow-200" />;
  return <Sun className="text-yellow-400" />;
};

const Forecast: React.FC<ForecastProps> = ({ data }) => {
  const list = data.list.slice(0, 8);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="w-full h-full glass-panel p-6 rounded-3xl flex flex-col justify-center">
      <div className="flex items-center justify-between mb-4 pl-2">
         <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest">Hourly Forecast</h3>
         <span className="text-[10px] text-white/30 font-mono">NEXT 24H</span>
      </div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide snap-x pt-2"
      >
        {list.map((forecast, index) => {
          const date = new Date(forecast.dt * 1000);
          const hours = date.getHours();
          const isNight = hours >= 18 || hours <= 6;
          
          return (
            <motion.div
              key={forecast.dt}
              variants={item}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
              className="flex-shrink-0 w-20 flex flex-col items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 snap-center transition-colors cursor-pointer"
            >
              <span className="text-xs font-medium text-white/50">
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(':00', '')}
              </span>
              <div className="my-2 transform scale-110">
                 {getWeatherIcon(forecast.weather[0].main, isNight)}
              </div>
              <span className="text-lg font-bold">{Math.round(forecast.main.temp)}°</span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Forecast;