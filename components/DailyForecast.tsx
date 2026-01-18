import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ForecastData, DailyForecastSummary } from '../types';
import { CalendarDays, CloudRain } from 'lucide-react';

interface DailyForecastProps {
  data: ForecastData;
}

const DailyForecast: React.FC<DailyForecastProps> = ({ data }) => {
  const dailyData = useMemo(() => {
    const map: Record<string, DailyForecastSummary> = {};
    
    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!map[date]) {
        map[date] = {
          date,
          dayName: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
          minTemp: item.main.temp_min,
          maxTemp: item.main.temp_max,
          pop: item.pop,
          weather: item.weather[0]
        };
      } else {
        map[date].minTemp = Math.min(map[date].minTemp, item.main.temp_min);
        map[date].maxTemp = Math.max(map[date].maxTemp, item.main.temp_max);
        map[date].pop = Math.max(map[date].pop, item.pop);
        if (item.weather[0].id < 800) {
            map[date].weather = item.weather[0];
        }
      }
    });
    return Object.values(map).slice(0, 5);
  }, [data]);

  const globalMin = Math.min(...dailyData.map(d => d.minTemp));
  const globalMax = Math.max(...dailyData.map(d => d.maxTemp));

  return (
    <motion.div 
      whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.4)' }}
      className="w-full h-full glass-panel p-6 rounded-3xl transition-all duration-300"
    >
      <div className="flex items-center space-x-2 mb-6 text-white/60">
        <CalendarDays size={18} />
        <h3 className="text-xs font-bold uppercase tracking-widest">5-Day Outlook</h3>
      </div>
      
      <div className="space-y-2">
        {dailyData.map((day, i) => {
          const range = globalMax - globalMin || 1;
          const left = ((day.minTemp - globalMin) / range) * 100;
          const width = ((day.maxTemp - day.minTemp) / range) * 100;

          return (
            <motion.div 
              key={day.date}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
              className="grid grid-cols-12 gap-2 items-center text-sm p-2 rounded-xl cursor-default"
            >
              <div className="col-span-2 font-medium text-white/90">{day.dayName}</div>
              
              <div className="col-span-2 flex items-center justify-center h-full">
                  {day.pop > 0.2 && (
                    <div className="flex items-center text-blue-300 text-xs bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                        <CloudRain size={10} className="mr-1" />
                        {Math.round(day.pop * 100)}%
                    </div>
                  )}
              </div>
              
              <div className="col-span-1 text-right text-white/60 text-xs">{Math.round(day.minTemp)}°</div>
              
              <div className="col-span-6 relative h-1.5 bg-white/10 rounded-full mx-2">
                <div 
                    className="absolute h-full rounded-full bg-gradient-to-r from-blue-300 to-yellow-300 opacity-80"
                    style={{ 
                        left: `${Math.max(0, left)}%`, 
                        width: `${Math.max(5, width)}%` 
                    }}
                ></div>
              </div>
              
              <div className="col-span-1 text-left text-white font-semibold text-xs">{Math.round(day.maxTemp)}°</div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DailyForecast;