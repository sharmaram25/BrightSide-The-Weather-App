import React from 'react';
import { motion } from 'framer-motion';
import { WeatherData } from '../types';
import { Coffee, Map, Camera, BookOpen, Beer, Tent, Music, Sun, Waves } from 'lucide-react';

interface ActivityGuideProps {
  weather: WeatherData;
}

interface Activity {
    name: string;
    icon: React.ReactNode;
    suitability: string;
    theme: string;
}

const ActivityGuide: React.FC<ActivityGuideProps> = ({ weather }) => {
  const temp = weather.main.temp;
  const code = weather.weather[0].id;
  const isClear = code === 800;
  const isRain = code >= 500 && code < 600;
  const isSnow = code >= 600 && code < 700;
  const isCloudy = code > 800;

  const suggestions: Activity[] = [];

  if (isClear && temp > 15 && temp < 30) {
      suggestions.push({ name: "Rooftop Bar", icon: <Beer size={18} />, suitability: "Perfect", theme: "bg-orange-500/20 text-orange-200" });
      suggestions.push({ name: "Botanical Garden", icon: <Sun size={18} />, suitability: "Ideal", theme: "bg-green-500/20 text-green-200" });
      suggestions.push({ name: "Street Photography", icon: <Camera size={18} />, suitability: "Great Light", theme: "bg-blue-500/20 text-blue-200" });
  } else if (isRain || isSnow || temp < 5) {
      suggestions.push({ name: "Art Gallery", icon: <Map size={18} />, suitability: "Indoor", theme: "bg-purple-500/20 text-purple-200" });
      suggestions.push({ name: "Cozy Cafe", icon: <Coffee size={18} />, suitability: "Comfort", theme: "bg-yellow-900/40 text-yellow-200" });
      suggestions.push({ name: "Library", icon: <BookOpen size={18} />, suitability: "Quiet", theme: "bg-amber-500/20 text-amber-200" });
  } else if (temp > 30) {
      suggestions.push({ name: "Shopping Mall", icon: <Map size={18} />, suitability: "AC Cooled", theme: "bg-blue-400/20 text-blue-200" });
      suggestions.push({ name: "Cinema", icon: <Music size={18} />, suitability: "Escape Heat", theme: "bg-red-500/20 text-red-200" });
      suggestions.push({ name: "Water Park", icon: <Waves size={18} />, suitability: "Cool Down", theme: "bg-cyan-500/20 text-cyan-200" });
  } else if (isCloudy) {
       suggestions.push({ name: "City Walk", icon: <Map size={18} />, suitability: "Pleasant", theme: "bg-gray-500/20 text-gray-200" });
       suggestions.push({ name: "Local Market", icon: <Tent size={18} />, suitability: "Explore", theme: "bg-orange-500/20 text-orange-200" });
  } else {
      suggestions.push({ name: "Museum", icon: <BookOpen size={18} />, suitability: "Safe Bet", theme: "bg-white/10 text-white" });
      suggestions.push({ name: "Live Music Venue", icon: <Music size={18} />, suitability: "Fun", theme: "bg-pink-500/20 text-pink-200" });
      suggestions.push({ name: "Historic Site", icon: <Map size={18} />, suitability: "Explore", theme: "bg-white/10 text-white" });
  }

  // Ensure unique keys if needed or fallback logic
  const finalSuggestions = suggestions.slice(0, 3);

  return (
    <motion.div 
      whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.4)' }}
      className="w-full glass-panel p-6 rounded-3xl h-full transition-all duration-300"
    >
      <div className="flex items-center space-x-2 mb-6 text-white/60">
        <Map size={18} />
        <h3 className="text-xs font-bold uppercase tracking-widest">Local Recommendations</h3>
      </div>
      
      <div className="space-y-3">
        {finalSuggestions.map((activity, i) => (
          <motion.div 
            key={activity.name}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
            whileHover={{ scale: 1.03, x: 5, backgroundColor: 'rgba(255,255,255,0.1)' }}
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 transition-colors group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${activity.theme}`}>
                    {activity.icon}
                </div>
                <div>
                    <div className="font-semibold text-sm text-white/90 group-hover:text-white transition-colors">{activity.name}</div>
                    <div className="text-[10px] uppercase tracking-wider opacity-60">{activity.suitability}</div>
                </div>
            </div>
            <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ActivityGuide;