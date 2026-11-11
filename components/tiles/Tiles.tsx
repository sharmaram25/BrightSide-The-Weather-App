import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Wind, Thermometer, Droplets, Eye, Gauge, CloudRain, Cloud, Moon, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Forecast, Settings } from '../../lib/model';
import {
  beaufort,
  compass,
  fmtDistance,
  fmtHour,
  fmtPrecip,
  fmtPressureValue,
  fmtTemp,
  pressureUnitLabel,
  toTempDelta,
  toWind,
  uvInfo,
  windUnitLabel,
} from '../../lib/format';
import { upcoming } from '../../lib/insights';
import { moonInfo, moonPath } from '../../lib/astro';
import { Card } from '../ui';

interface TileProps {
  data: Forecast;
  settings: Settings;
  delay?: number;
}

const Tile: React.FC<{ title: string; icon: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; note?: React.ReactNode; delay?: number; className?: string }> = ({
  title,
  icon,
  right,
  children,
  note,
  delay,
  className = '',
}) => (
  <Card title={title} icon={icon} right={right} delay={delay} className={`flex min-h-[172px] flex-col ${className}`}>
    <div className="flex-1">{children}</div>
    {note && <p className="mt-2 text-[13px] leading-snug text-white/70">{note}</p>}
  </Card>
);

const Big: React.FC<{ children: React.ReactNode; unit?: string }> = ({ children, unit }) => (
  <div className="tnum flex items-baseline gap-1 text-[34px] font-medium leading-none tracking-tight">
    {children}
    {unit && <span className="text-[15px] font-medium text-white/60">{unit}</span>}
  </div>
);

// ------------------------------------------------------------------ UV

export const UVTile: React.FC<TileProps> = ({ data, settings, delay }) => {
  const uv = data.current.uv ?? 0;
  const info = uvInfo(uv);
  const today = upcoming(data, 14).filter((h) => h.uv != null && h.condition.isDay);
  const high = today.filter((h) => (h.uv ?? 0) >= 3);
  const note = high.length
    ? `Use sun protection ${fmtHour(high[0].time - 5400, data.offset, settings)}–${fmtHour(high[high.length - 1].time + 5400, data.offset, settings)}.`
    : 'Low for the rest of the day.';
  return (
    <Tile title="UV index" icon={<Sun size={13} />} note={note} delay={delay}>
      <Big>{Math.round(uv)}</Big>
      <div className="mt-1 text-[17px] font-semibold" style={{ color: info.color }}>
        {info.label}
      </div>
      <div className="relative mt-3 h-[5px] rounded-full" style={{ background: 'linear-gradient(90deg,#4ade80,#facc15,#fb923c,#f43f5e,#c084fc)' }}>
        <motion.div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black/40 bg-white shadow"
          initial={{ left: '0%' }}
          whileInView={{ left: `${Math.min(100, (uv / 11) * 100)}%` }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.3 }}
        />
      </div>
    </Tile>
  );
};

// ------------------------------------------------------------------ Wind

export const WindTile: React.FC<TileProps> = ({ data, settings, delay }) => {
  const c = data.current;
  const bf = beaufort(c.windSpeed);
  const speed = toWind(c.windSpeed, settings);
  return (
    <Tile
      title="Wind"
      icon={<Wind size={13} />}
      delay={delay}
      note={
        <>
          {bf.label}
          {c.windGust ? ` · gusts ${Math.round(toWind(c.windGust, settings))} ${windUnitLabel(settings)}` : ''}
        </>
      }
    >
      <div className="relative mx-auto mt-0.5 h-[104px] w-[104px]">
        <svg viewBox="0 0 100 100" className="absolute inset-0">
          {Array.from({ length: 60 }).map((_, i) => {
            const a = (i * 6 * Math.PI) / 180;
            const major = i % 15 === 0;
            const r1 = major ? 40 : 43;
            return <line key={i} x1={50 + Math.sin(a) * r1} y1={50 - Math.cos(a) * r1} x2={50 + Math.sin(a) * 47} y2={50 - Math.cos(a) * 47} stroke="white" strokeOpacity={major ? 0.7 : 0.22} strokeWidth={major ? 1.6 : 1} />;
          })}
          {['N', 'E', 'S', 'W'].map((l, i) => {
            const a = (i * 90 * Math.PI) / 180;
            return (
              <text key={l} x={50 + Math.sin(a) * 32} y={50 - Math.cos(a) * 32 + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="white" fillOpacity={l === 'N' ? 0.9 : 0.5}>
                {l}
              </text>
            );
          })}
        </svg>
        <motion.div
          className="absolute inset-0"
          initial={{ rotate: (c.windDeg + 180) % 360 - 120 }}
          whileInView={{ rotate: (c.windDeg + 180) % 360 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 40, damping: 9, delay: 0.25 }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <line x1="50" y1="86" x2="50" y2="20" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M50 10 L56 22 L44 22 Z" fill="white" />
            <circle cx="50" cy="86" r="3.2" fill="none" stroke="white" strokeWidth="2" />
          </svg>
        </motion.div>
        <div className="absolute inset-[30%] grid place-items-center rounded-full bg-[rgba(10,16,32,0.55)] backdrop-blur-sm">
          <div className="text-center leading-none">
            <div className="tnum text-[17px] font-semibold">{settings.wind === 'ms' ? speed.toFixed(1) : Math.round(speed)}</div>
            <div className="text-[9px] font-semibold text-white/60">{windUnitLabel(settings)}</div>
          </div>
        </div>
      </div>
      <div className="sr-only">From {compass(c.windDeg)}</div>
    </Tile>
  );
};

// ------------------------------------------------------------------ Feels like

export const FeelsTile: React.FC<TileProps> = ({ data, settings, delay }) => {
  const c = data.current;
  const diff = c.feelsLike - c.temp;
  const note =
    Math.abs(diff) < 1.5
      ? 'Similar to the actual temperature.'
      : diff > 0
        ? c.humidity > 55
          ? 'Humidity is making it feel warmer.'
          : 'Sunshine is making it feel warmer.'
        : c.windSpeed > 3
          ? 'Wind is making it feel cooler.'
          : 'It feels cooler than the actual temperature.';
  return (
    <Tile title="Feels like" icon={<Thermometer size={13} />} note={note} delay={delay}>
      <Big>{fmtTemp(c.feelsLike, settings)}</Big>
      <div className="mt-2 text-[13px] text-white/55">
        Actual {fmtTemp(c.temp, settings)}
        {Math.abs(diff) >= 1 && (
          <span className={diff > 0 ? 'text-orange-300' : 'text-sky-300'}>
            {' '}
            ({diff > 0 ? '+' : '−'}
            {Math.abs(Math.round(toTempDelta(diff, settings)))}°)
          </span>
        )}
      </div>
    </Tile>
  );
};

// ------------------------------------------------------------------ Humidity

export const HumidityTile: React.FC<TileProps> = ({ data, settings, delay }) => {
  const c = data.current;
  const dp = c.dewPoint;
  const comfort = dp < 10 ? 'Dry' : dp < 16 ? 'Comfortable' : dp < 19 ? 'Slightly humid' : dp < 22 ? 'Muggy' : 'Oppressive';
  return (
    <Tile title="Humidity" icon={<Droplets size={13} />} delay={delay} note={`Dew point ${fmtTemp(dp, settings)} — ${comfort.toLowerCase()}.`}>
      <Big unit="%">{c.humidity}</Big>
      <div className="mt-3 flex gap-[3px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.span
            key={i}
            className="h-6 flex-1 rounded-[4px]"
            initial={{ opacity: 0.15, scaleY: 0.6 }}
            whileInView={{ opacity: i < Math.round(c.humidity / 10) ? 1 : 0.15, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.04 }}
            style={{ background: i < Math.round(c.humidity / 10) ? `rgba(125,211,252,${0.45 + i * 0.05})` : 'rgba(255,255,255,0.4)' }}
          />
        ))}
      </div>
    </Tile>
  );
};

// ------------------------------------------------------------------ Visibility

export const VisibilityTile: React.FC<TileProps> = ({ data, settings, delay }) => {
  const v = data.current.visibility;
  const note = v >= 10000 ? 'Perfectly clear view.' : v >= 5000 ? 'Light haze in the distance.' : v >= 1000 ? 'Hazy — distant objects fade.' : 'Fog is limiting visibility.';
  const [num, unit] = fmtDistance(v, settings).split(' ');
  return (
    <Tile title="Visibility" icon={<Eye size={13} />} note={note} delay={delay}>
      <Big unit={unit}>
        {num}
        {v >= 10000 ? '+' : ''}
      </Big>
    </Tile>
  );
};

// ------------------------------------------------------------------ Pressure

export const PressureTile: React.FC<TileProps> = ({ data, settings, delay }) => {
  const p = data.current.pressure;
  const later = data.hourly.find((h) => h.time >= Date.now() / 1000 + 5 * 3600);
  const delta = later ? later.pressure - p : 0;
  const trend = delta >= 1.5 ? 'rising' : delta <= -1.5 ? 'falling' : 'steady';
  const frac = Math.max(0, Math.min(1, (p - 960) / 90));
  const angle = -120 + frac * 240;
  const arc = (a0: number, a1: number, r: number) => {
    const p0 = [50 + r * Math.sin((a0 * Math.PI) / 180), 54 - r * Math.cos((a0 * Math.PI) / 180)];
    const p1 = [50 + r * Math.sin((a1 * Math.PI) / 180), 54 - r * Math.cos((a1 * Math.PI) / 180)];
    return `M ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1[0]} ${p1[1]}`;
  };
  const TrendIcon = trend === 'rising' ? ArrowUp : trend === 'falling' ? ArrowDown : Minus;
  return (
    <Tile
      title="Pressure"
      icon={<Gauge size={13} />}
      delay={delay}
      note={trend === 'rising' ? 'Rising — settled weather ahead.' : trend === 'falling' ? 'Falling — unsettled weather possible.' : 'Steady over the next few hours.'}
    >
      <div className="relative mx-auto h-[96px] w-[112px]">
        <svg viewBox="0 0 100 86" className="absolute inset-0 h-full w-full">
          {Array.from({ length: 41 }).map((_, i) => {
            const a = ((-120 + i * 6) * Math.PI) / 180;
            return <line key={i} x1={50 + Math.sin(a) * 38} y1={54 - Math.cos(a) * 38} x2={50 + Math.sin(a) * 45} y2={54 - Math.cos(a) * 45} stroke="white" strokeOpacity={0.22} strokeWidth={1.2} />;
          })}
          <motion.path
            d={arc(-120, angle, 41.5)}
            fill="none"
            stroke="white"
            strokeWidth={3.5}
            strokeOpacity={0.9}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-x-0 top-[32px] text-center leading-none">
          <TrendIcon size={14} className="mx-auto mb-1 text-white/70" />
          <div className="tnum text-[19px] font-semibold">{fmtPressureValue(p, settings)}</div>
          <div className="text-[10px] font-semibold text-white/55">{pressureUnitLabel(settings)}</div>
        </div>
      </div>
    </Tile>
  );
};

// ------------------------------------------------------------------ Precipitation

export const PrecipTile: React.FC<TileProps> = ({ data, settings, delay }) => {
  const next = upcoming(data, 24).filter((h) => h.time > Date.now() / 1000 - 3600);
  const total = next.reduce((s, h) => s + h.precip, 0);
  const now = data.current.precip1h;
  const [num, unit] = fmtPrecip(total, settings).split(' ');
  return (
    <Tile
      title="Precipitation"
      icon={<CloudRain size={13} />}
      delay={delay}
      note={now > 0 ? `${fmtPrecip(now, settings)} in the last hour.` : total > 0.2 ? `Peak chance ${Math.round(Math.max(...next.map((h) => h.pop)) * 100)}%.` : 'None expected in the next 24 hours.'}
    >
      <Big unit={unit}>{num}</Big>
      <div className="mt-1 text-[13px] font-medium text-white/60">expected in next 24h</div>
    </Tile>
  );
};

// ------------------------------------------------------------------ Clouds

export const CloudsTile: React.FC<TileProps> = ({ data, settings, delay }) => {
  const c = data.current;
  const base = Math.max(0, (c.temp - c.dewPoint) * 125);
  const baseText = settings.distance === 'mi' ? `${Math.round((base * 3.281) / 100) * 100} ft` : `${Math.round(base / 50) * 50} m`;
  return (
    <Tile title="Cloud cover" icon={<Cloud size={13} />} delay={delay} note={c.clouds > 5 ? `Estimated cloud base ≈ ${baseText}.` : 'Not a cloud in the sky.'}>
      <Big unit="%">{c.clouds}</Big>
      <div className="relative mt-3 h-[5px] overflow-hidden rounded-full bg-black/25">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-slate-300 to-white"
          initial={{ width: 0 }}
          whileInView={{ width: `${c.clouds}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </div>
    </Tile>
  );
};

// ------------------------------------------------------------------ Moon

export const MoonTile: React.FC<TileProps & { wide?: boolean }> = ({ data, delay, wide }) => {
  const m = moonInfo(Date.now());
  const toFull = m.daysToFull;
  const toNew = m.daysToNew;
  const nextLabel = toFull < toNew ? (toFull < 1 ? 'Full moon tonight' : `Full moon in ${Math.round(toFull)} days`) : toNew < 1 ? 'New moon tonight' : `New moon in ${Math.round(toNew)} days`;
  const southern = data.lat < 0;
  const art = (
    <motion.svg
      viewBox="0 0 100 100"
      className={wide ? 'h-20 w-20 shrink-0' : 'h-[72px] w-[72px]'}
      initial={{ rotate: -20, opacity: 0 }}
      whileInView={{ rotate: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 60, damping: 14 }}
    >
      <defs>
        <radialGradient id="moonlit" cx="40%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#fdfdfb" />
          <stop offset="100%" stopColor="#c9d1de" />
        </radialGradient>
        <radialGradient id="moonglow">
          <stop offset="60%" stopColor="#dbe5ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#dbe5ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#moonglow)" />
      <circle cx="50" cy="50" r="34" fill="#1d2436" />
      <path d={moonPath(m.phase, 50, 50, 34, southern)} fill="url(#moonlit)" />
      <g fill="#000" opacity="0.07">
        <circle cx="40" cy="40" r="6" />
        <circle cx="60" cy="58" r="8" />
        <circle cx="47" cy="66" r="4" />
        <circle cx="64" cy="36" r="3.5" />
      </g>
    </motion.svg>
  );
  return (
    <Card title="Moon" icon={<Moon size={13} />} delay={delay} className={`${wide ? 'col-span-2' : ''} min-h-[172px]`}>
      <div className={wide ? 'flex items-center gap-5' : 'flex flex-col'}>
        {art}
        <div className={wide ? '' : 'mt-2'}>
          <div className="text-[17px] font-semibold">{m.name}</div>
          <div className="mt-0.5 text-[13px] text-white/65">{Math.round(m.fraction * 100)}% illuminated</div>
          <div className="mt-0.5 text-[13px] text-white/65">{nextLabel}</div>
        </div>
      </div>
    </Card>
  );
};
