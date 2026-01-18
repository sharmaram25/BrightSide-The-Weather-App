import React from 'react';
import { motion } from 'framer-motion';
import { WeatherData } from '../types';
import { Sunrise, Sunset, Clock, Moon } from 'lucide-react';

interface AstroPanelProps {
  data: WeatherData;
}

const AstroPanel: React.FC<AstroPanelProps> = ({ data }) => {
  const now = Date.now() / 1000;
  const { sunrise, sunset } = data.sys;
  
  const isDay = now >= sunrise && now <= sunset;
  
  // Calculate visual progress (0 to 1)
  let progress = 0;
  if (isDay) {
    progress = (now - sunrise) / (sunset - sunrise);
  } else {
    // Night progress (sunset to sunrise next day)
    // Simplify: if before sunrise, it's late night. If after sunset, it's early night.
    // For UI simplicity in this version, we will just show a moon layout if it's night.
  }

  // Formatting helpers
  const formatTime = (ts: number) => new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const daylightSeconds = sunset - sunrise;
  const hours = Math.floor(daylightSeconds / 3600);
  const minutes = Math.floor((daylightSeconds % 3600) / 60);

  // Bezier Curve Calculation for Sun Position
  // Curve from (0, 80) -> control(50, -20) -> (100, 80)
  // Formula: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
  const p0 = { x: 0, y: 100 };
  const p1 = { x: 50, y: -20 };
  const p2 = { x: 100, y: 100 };

  const t = Math.max(0, Math.min(1, progress));
  const sunX = Math.pow(1-t, 2) * p0.x + 2 * (1-t) * t * p1.x + Math.pow(t, 2) * p2.x;
  const sunY = Math.pow(1-t, 2) * p0.y + 2 * (1-t) * t * p1.y + Math.pow(t, 2) * p2.y;

  return (
    <motion.div 
      whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.4)' }}
      className="glass-panel p-6 rounded-3xl flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300"
    >
        <div className="flex items-center justify-between mb-4 relative z-10">
             <div className="flex items-center space-x-2 text-white/60">
                {isDay ? <Clock size={18} /> : <Moon size={18} />}
                <h3 className="text-xs font-bold uppercase tracking-widest">{isDay ? 'Solar Cycle' : 'Lunar Cycle'}</h3>
             </div>
             {isDay && (
                 <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-white/70">
                     {hours}h {minutes}m Daylight
                 </span>
             )}
        </div>

        {/* Visualization Area */}
        <div className="relative h-32 w-full mt-2 mb-2">
            
            {/* The Sky Gradient Fill under curve */}
            {isDay ? (
                <div className="absolute inset-0 overflow-hidden rounded-b-xl">
                   <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="skyGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="rgba(253, 184, 19, 0.2)" />
                          <stop offset="100%" stopColor="rgba(253, 184, 19, 0)" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M 0,100 Q 50,-20 100,100" 
                        fill="url(#skyGradient)" 
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                   </svg>
                   
                   {/* The Sun Indicator */}
                   <motion.div 
                     className="absolute w-6 h-6 bg-yellow-300 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.8)] border-2 border-white/80 z-20 flex items-center justify-center"
                     style={{ 
                         left: `calc(${sunX}% - 12px)`, 
                         top: `calc(${sunY}% - 12px)`
                     }}
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ delay: 0.5, type: 'spring' }}
                   >
                     <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                   </motion.div>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    {/* Night View */}
                    <div className="w-full h-px bg-white/10 absolute top-1/2"></div>
                    <div className="flex flex-col items-center z-10">
                        <Moon size={32} className="text-blue-100 mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                        <span className="text-xs text-white/50">Sun is below horizon</span>
                    </div>
                </div>
            )}
        </div>

        {/* Data Footer */}
        <div className="flex justify-between items-end relative z-10 mt-4 border-t border-white/5 pt-4">
            <div className="group cursor-default">
                <div className="flex items-center space-x-1 text-white/40 mb-1 group-hover:text-yellow-200 transition-colors">
                    <Sunrise size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Sunrise</span>
                </div>
                <div className="text-lg font-mono font-bold">{formatTime(sunrise)}</div>
            </div>
            
            <div className="text-right group cursor-default">
                 <div className="flex items-center space-x-1 text-white/40 mb-1 justify-end group-hover:text-orange-300 transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Sunset</span>
                    <Sunset size={14} />
                </div>
                <div className="text-lg font-mono font-bold">{formatTime(sunset)}</div>
            </div>
        </div>
    </motion.div>
  );
};

export default AstroPanel;