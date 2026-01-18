import React from 'react';
import { motion } from 'framer-motion';
import { WeatherData } from '../types';
import { Compass, Waves, Cloud, ArrowDownToLine, Eye, Gauge } from 'lucide-react';

interface AdvancedStatsProps {
  data: WeatherData;
}

const StatBox = ({ label, value, subtext, icon, delay }: any) => (
  <motion.div
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between cursor-pointer"
  >
    <div className="flex justify-between items-start mb-2">
      <div className="text-white/40">{icon}</div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">{label}</span>
    </div>
    <div>
      <div className="text-xl font-bold text-white font-mono">{value}</div>
      {subtext && <div className="text-xs text-white/50 mt-1">{subtext}</div>}
    </div>
  </motion.div>
);

const AdvancedStats: React.FC<AdvancedStatsProps> = ({ data }) => {
  const T = data.main.temp;
  const RH = data.main.humidity;
  const dewPoint = (T - ((100 - RH) / 5)).toFixed(1);
  const cloudBase = Math.max(0, Math.round((T - parseFloat(dewPoint)) * 125));
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const windDir = directions[Math.round(data.wind.deg / 45) % 8];

  return (
    <motion.div 
      whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.4)' }}
      className="w-full glass-panel p-6 rounded-3xl h-full transition-all duration-300"
    >
      <div className="flex items-center space-x-2 mb-6 text-white/60">
        <Gauge size={18} />
        <h3 className="text-xs font-bold uppercase tracking-widest">Atmospheric Telemetry</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatBox 
          label="Wind Vector" 
          value={`${data.wind.speed.toFixed(1)} m/s`} 
          subtext={`${data.wind.deg}° (${windDir}) ${data.wind.gust ? `Gust: ${data.wind.gust}` : ''}`}
          icon={<Compass size={16} />}
          delay={0.1}
        />
        
        <StatBox 
          label="Pressure" 
          value={`${data.main.pressure} hPa`} 
          subtext={data.main.sea_level ? `Sea: ${data.main.sea_level}` : 'Stable'}
          icon={<ArrowDownToLine size={16} />}
          delay={0.2}
        />

        <StatBox 
          label="Est. Cloud Base" 
          value={`${cloudBase} m`} 
          subtext={`Cover: ${data.clouds.all}%`}
          icon={<Cloud size={16} />}
          delay={0.3}
        />

        <StatBox 
          label="Dew Point" 
          value={`${dewPoint}°C`} 
          subtext={`Humidity: ${RH}%`}
          icon={<Waves size={16} />}
          delay={0.4}
        />

        <StatBox 
          label="Visibility" 
          value={`${(data.visibility / 1000).toFixed(1)} km`} 
          subtext={data.visibility > 9000 ? "Excellent" : "Reduced"}
          icon={<Eye size={16} />}
          delay={0.5}
        />
        
        <StatBox 
          label="Precipitation" 
          value={data.rain ? `${data.rain['1h'] || 0} mm` : data.snow ? `${data.snow['1h'] || 0} mm` : '0 mm'} 
          subtext="Past 1 Hour"
          icon={<Cloud size={16} />}
          delay={0.6}
        />
      </div>
    </motion.div>
  );
};

export default AdvancedStats;