import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Droplets, Sun, Sunrise, Sunset, Wind, Umbrella, Thermometer, Clock } from 'lucide-react';
import { Forecast, Settings } from '../lib/model';
import { compass, fmtDate, fmtDuration, fmtPrecip, fmtTemp, fmtTime, fmtWind, uvInfo } from '../lib/format';
import { daySummary } from '../lib/insights';
import { tap } from '../lib/haptics';
import { Sheet, Segmented } from './ui';
import WeatherIcon from './WeatherIcon';
import HourlyStrip, { buildStrip, StripMetric } from './HourlyStrip';

interface Props {
  data: Forecast;
  settings: Settings;
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}

const Stat = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) => (
  <div className="rounded-2xl bg-white/[0.06] p-3.5">
    <div className="label mb-1.5 flex items-center gap-1.5 !text-[10px]">
      {icon}
      {label}
    </div>
    <div className="tnum text-[19px] font-semibold">{value}</div>
    {sub && <div className="mt-0.5 text-[12px] text-white/50">{sub}</div>}
  </div>
);

const DaySheet: React.FC<Props> = ({ data, settings, index, onIndex, onClose }) => {
  const [dir, setDir] = useState(1);
  const [metric, setMetric] = useState<StripMetric>('temp');
  const open = index !== null;
  const day = index !== null ? data.daily[index] : null;

  const go = (d: 1 | -1) => {
    if (index === null) return;
    const n = index + d;
    if (n < 0 || n >= data.daily.length) return;
    tap(6);
    setDir(d);
    onIndex(n);
  };

  const items = useMemo(() => {
    if (!day || !day.hours.length) return [];
    return buildStrip(day.hours, { sunEvents: [{ t: day.sunrise, type: 'sunrise' }, { t: day.sunset, type: 'sunset' }] });
  }, [day]);

  const feels = day?.hours.length ? { lo: Math.min(...day.hours.map((h) => h.feelsLike)), hi: Math.max(...day.hours.map((h) => h.feelsLike)) } : null;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -70 || info.velocity.x < -500) go(1);
    else if (info.offset.x > 70 || info.velocity.x > 500) go(-1);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={day ? (index === 0 ? 'Today' : fmtDate(day.time + 43200, data.offset)) : ''}
      headerRight={
        <div className="flex gap-1">
          <button aria-label="Previous day" disabled={!index} onClick={() => go(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <button aria-label="Next day" disabled={index === null || index >= data.daily.length - 1} onClick={() => go(1)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>
      }
    >
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        {day && (
          <motion.div
            key={day.key}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d * 60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={onDragEnd}
            style={{ touchAction: 'pan-y' }}
            className="pb-4"
          >
            <div className="flex items-center gap-4 py-2">
              <WeatherIcon kind={day.condition.kind} isDay size={72} animated />
              <div>
                <div className="text-[20px] font-semibold">{day.condition.label}</div>
                <div className="tnum text-[15px] text-white/70">
                  H: {fmtTemp(day.tMax, settings)} · L: {fmtTemp(day.tMin, settings)}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[15px] leading-snug text-white/80">{daySummary(day, data.offset, settings)}</p>

            {items.length > 0 && (
              <div className="mt-5 rounded-[22px] bg-white/[0.05] p-4">
                <div className="mb-3">
                  <Segmented<StripMetric>
                    value={metric}
                    onChange={setMetric}
                    layoutId="day-metric"
                    size="sm"
                    options={[
                      { value: 'temp', label: 'Temp' },
                      { value: 'rain', label: 'Rain' },
                      { value: 'wind', label: 'Wind' },
                      ...(day.hours.some((h) => h.uv != null) ? [{ value: 'uv' as StripMetric, label: 'UV' }] : []),
                    ]}
                  />
                </div>
                <HourlyStrip items={items} metric={metric} offset={data.offset} settings={settings} gid={`day-${day.key}`} />
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Stat icon={<Umbrella size={12} />} label="Precipitation" value={fmtPrecip(day.precip, settings)} sub={`${Math.round(day.pop * 100)}% chance`} />
              <Stat
                icon={<Wind size={12} />}
                label="Wind"
                value={day.windMax != null ? fmtWind(day.windMax, settings) : '—'}
                sub={[day.windDeg != null ? `From ${compass(day.windDeg)}` : '', day.gustMax ? `gusts ${fmtWind(day.gustMax, settings)}` : ''].filter(Boolean).join(', ')}
              />
              {day.uvMax != null && <Stat icon={<Sun size={12} />} label="UV index" value={`${Math.round(day.uvMax)}`} sub={uvInfo(day.uvMax).label} />}
              {day.humidity != null && <Stat icon={<Droplets size={12} />} label="Humidity" value={`${day.humidity}%`} sub="Daily average" />}
              {feels && <Stat icon={<Thermometer size={12} />} label="Feels like" value={`${fmtTemp(feels.lo, settings)} – ${fmtTemp(feels.hi, settings)}`} />}
              <Stat icon={<Clock size={12} />} label="Daylight" value={Number.isFinite(day.sunset - day.sunrise) ? fmtDuration(day.sunset - day.sunrise) : '—'} />
              <Stat icon={<Sunrise size={12} />} label="Sunrise" value={Number.isFinite(day.sunrise) ? fmtTime(day.sunrise, data.offset, settings) : '—'} />
              <Stat icon={<Sunset size={12} />} label="Sunset" value={Number.isFinite(day.sunset) ? fmtTime(day.sunset, data.offset, settings) : '—'} />
            </div>
            {day.extended && <p className="mt-4 text-center text-[11px] text-white/35">Extended outlook from Open-Meteo</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
};

export default DaySheet;
