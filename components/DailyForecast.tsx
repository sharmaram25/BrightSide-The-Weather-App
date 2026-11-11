import React from 'react';
import { motion, Variants } from 'framer-motion';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { Forecast, Settings } from '../lib/model';
import { fmtTemp, fmtWeekday, tempColor } from '../lib/format';
import { tap } from '../lib/haptics';
import { Card, EASE_OUT } from './ui';
import WeatherIcon from './WeatherIcon';

interface DailyForecastProps {
  data: Forecast;
  settings: Settings;
  onSelect: (index: number) => void;
}

// One in-view trigger on the list drives every row, bar and dot through variants.
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } } };
const row: Variants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE_OUT } } };
const bar: Variants = { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.7, ease: EASE_OUT, delay: 0.1 } } };
const dotV: Variants = { hidden: { scale: 0 }, show: { scale: 1, transition: { type: 'spring', stiffness: 400, damping: 22, delay: 0.5 } } };

const DailyForecast: React.FC<DailyForecastProps> = ({ data, settings, onSelect }) => {
  const days = data.daily;
  const lo = Math.min(...days.map((d) => d.tMin));
  const hi = Math.max(...days.map((d) => d.tMax));
  const span = hi - lo || 1;
  const current = data.current.temp;

  return (
    <Card title={`${days.length}-day forecast`} icon={<CalendarDays size={13} />} pad={false} className="pb-1.5">
      <motion.ul variants={list} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
        {days.map((d, i) => {
          const left = ((d.tMin - lo) / span) * 100;
          const width = Math.max(6, ((d.tMax - d.tMin) / span) * 100);
          const dot = i === 0 ? ((Math.min(Math.max(current, d.tMin), d.tMax) - lo) / span) * 100 : null;
          return (
            <motion.li key={d.key} variants={row}>
              <button
                onClick={() => {
                  tap();
                  onSelect(i);
                }}
                className={`press group grid w-full grid-cols-[3.6rem_2.6rem_2.4rem_1fr_2.4rem_0.9rem] items-center gap-2 px-4 py-2.5 text-left active:bg-white/[0.07] ${i ? 'border-t border-white/[0.07]' : ''}`}
              >
                <span className="text-[15px] font-semibold">{i === 0 ? 'Today' : fmtWeekday(d.time + 43200, data.offset)}</span>
                <span className="flex flex-col items-center leading-none">
                  <WeatherIcon kind={d.condition.kind} isDay size={28} />
                  {d.pop >= 0.2 && <span className="mt-0.5 text-[10px] font-semibold text-sky-300">{Math.round(d.pop * 10) * 10}%</span>}
                </span>
                <span className="tnum text-right text-[15px] font-medium text-white/50">{fmtTemp(d.tMin, settings)}</span>
                <span className="relative h-[5px] rounded-full bg-black/25">
                  <motion.span
                    variants={bar}
                    className="absolute inset-y-0 rounded-full"
                    style={{ left: `${left}%`, width: `${width}%`, background: `linear-gradient(90deg, ${tempColor(d.tMin)}, ${tempColor(d.tMax)})`, originX: 0 }}
                  />
                  {dot !== null && (
                    <motion.span
                      variants={dotV}
                      className="absolute top-1/2 -ml-[4.5px] -mt-[4.5px] h-[9px] w-[9px] rounded-full border-2 border-black/30 bg-white"
                      style={{ left: `${dot}%` }}
                    />
                  )}
                </span>
                <span className="tnum text-[15px] font-semibold">{fmtTemp(d.tMax, settings)}</span>
                <ChevronRight size={14} className="text-white/25 transition-transform duration-200 group-active:translate-x-0.5" />
              </button>
            </motion.li>
          );
        })}
      </motion.ul>
    </Card>
  );
};

export default React.memo(DailyForecast);
