import React from 'react';
import { motion } from 'framer-motion';
import { WeatherData, AirQualityData } from '../types';
import { Sparkles, Umbrella, ThermometerSun, Wind, AlertTriangle, Leaf } from 'lucide-react';

interface WeatherInsightsProps {
  weather: WeatherData;
  aqi: AirQualityData | null;
}

const getAQILabel = (aqi: number) => {
  switch (aqi) {
    case 1: return { label: 'Good', color: 'bg-green-400', desc: 'Enjoy the outdoors!' };
    case 2: return { label: 'Fair', color: 'bg-yellow-400', desc: 'Moderate air quality.' };
    case 3: return { label: 'Moderate', color: 'bg-orange-400', desc: 'Sensitive groups should be careful.' };
    case 4: return { label: 'Poor', color: 'bg-red-400', desc: 'Avoid prolonged exertion.' };
    case 5: return { label: 'Very Poor', color: 'bg-purple-500', desc: 'Stay indoors if possible.' };
    default: return { label: 'Unknown', color: 'bg-gray-400', desc: '--' };
  }
};

const getTips = (weather: WeatherData): { icon: React.ReactNode, text: string } => {
  const temp = weather.main.temp;
  const main = weather.weather[0].main.toLowerCase();
  const id = weather.weather[0].id;

  if (id >= 200 && id < 600) return { icon: <Umbrella className="text-blue-300" />, text: "It's raining. Don't forget your umbrella." };
  if (temp > 35) return { icon: <ThermometerSun className="text-red-300" />, text: "Extreme heat! Stay hydrated & avoid direct sun." };
  if (temp > 28) return { icon: <ThermometerSun className="text-orange-300" />, text: "It's hot outside. Wear sunscreen." };
  if (temp < 10) return { icon: <Wind className="text-cyan-200" />, text: "It's chilly. Wear a warm jacket." };
  if (temp < 5) return { icon: <AlertTriangle className="text-blue-200" />, text: "Freezing conditions. Layer up properly." };
  if (main.includes('clear')) return { icon: <Sparkles className="text-yellow-300" />, text: "Perfect weather for a walk." };
  
  return { icon: <Sparkles className="text-white/80" />, text: "Have a wonderful day!" };
};

const WeatherInsights: React.FC<WeatherInsightsProps> = ({ weather, aqi }) => {
  const tip = getTips(weather);
  const aqiValue = aqi?.list[0].main.aqi || 0;
  const aqiInfo = getAQILabel(aqiValue);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full h-full flex flex-col gap-4"
    >
      {/* Smart Tip Card */}
      <motion.div 
        whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.4)' }}
        className="glass-panel p-5 rounded-3xl flex items-center space-x-4 flex-1 cursor-default transition-colors"
      >
        <div className="p-3 bg-white/10 rounded-full">
            {tip.icon}
        </div>
        <div>
            <h4 className="text-xs uppercase font-bold text-white/60 tracking-wider mb-1">BrightSide Tip</h4>
            <p className="text-lg font-medium leading-tight">{tip.text}</p>
        </div>
      </motion.div>

      {/* AQI Card */}
      {aqi && (
        <motion.div 
            whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.4)' }}
            className="glass-panel p-5 rounded-3xl flex items-center justify-between relative overflow-hidden flex-1 cursor-default transition-colors"
        >
             {/* Background glow based on AQI */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${aqiInfo.color}`}></div>
            
            <div className="flex items-center space-x-4 z-10">
                <div className={`p-3 rounded-full bg-white/10`}>
                    <Leaf className={`h-6 w-6 ${aqiValue > 3 ? 'text-red-300' : 'text-green-300'}`} />
                </div>
                <div>
                    <h4 className="text-xs uppercase font-bold text-white/60 tracking-wider mb-1">Air Quality</h4>
                    <p className="text-lg font-medium leading-tight">{aqiInfo.label} <span className="text-sm font-normal opacity-70">- {aqiInfo.desc}</span></p>
                </div>
            </div>
             <div className="text-3xl font-bold opacity-10 z-10 font-mono tracking-tighter">
                AQI
             </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default WeatherInsights;