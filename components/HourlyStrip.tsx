import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sunrise, Sunset, Navigation2 } from 'lucide-react';
import { Condition, Current, HourPoint, Settings } from '../lib/model';
import { fmtHour, fmtTime, tempColor, toTemp, toWind, uvInfo } from '../lib/format';
import WeatherIcon from './WeatherIcon';

export type StripMetric = 'temp' | 'rain' | 'wind' | 'uv';

export interface StripItem {
  t: number;
  type: 'now' | 'hour' | 'sunrise' | 'sunset';
  temp: number;
  pop: number;
  precip: number;
  wind: number;
  windDeg: number;
  uv: number | null;
  cond?: Condition;
}

const COL = 58;
const CHART_H = 92;
const PAD_T = 26;
const PAD_B = 10;

export const buildStrip = (hours: HourPoint[], opts: { current?: Current; sunEvents?: { t: number; type: 'sunrise' | 'sunset' }[] }): StripItem[] => {
  const items: StripItem[] = hours.map((h) => ({ t: h.time, type: 'hour', temp: h.temp, pop: h.pop, precip: h.precip, wind: h.windSpeed, windDeg: h.windDeg, uv: h.uv, cond: h.condition }));
  if (opts.current) {
    const c = opts.current;
    items.unshift({ t: Date.now() / 1000, type: 'now', temp: c.temp, pop: hours[0]?.pop ?? 0, precip: c.precip1h, wind: c.windSpeed, windDeg: c.windDeg, uv: c.uv, cond: c.condition });
  }
  const first = items[0]?.t ?? 0;
  const last = items[items.length - 1]?.t ?? 0;
  for (const ev of opts.sunEvents ?? []) {
    if (!Number.isFinite(ev.t) || ev.t <= first || ev.t >= last) continue;
    const idx = items.findIndex((it) => it.t > ev.t);
    const a = items[idx - 1];
    const b = items[idx];
    const k = (ev.t - a.t) / (b.t - a.t);
    items.splice(idx, 0, { t: ev.t, type: ev.type, temp: a.temp + (b.temp - a.temp) * k, pop: 0, precip: 0, wind: a.wind, windDeg: a.windDeg, uv: null });
  }
  return items;
};

const smoothPath = (pts: [number, number][]) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
};

interface Props {
  items: StripItem[];
  metric: StripMetric;
  offset: number;
  settings: Settings;
  gid: string;
}

const HourlyStrip: React.FC<Props> = ({ items, metric, offset, settings, gid }) => {
  const W = items.length * COL;
  const plotH = CHART_H - PAD_T - PAD_B;

  const { pts, labels, line } = useMemo(() => {
    const value = (it: StripItem) => (metric === 'temp' ? toTemp(it.temp, settings) : metric === 'wind' ? toWind(it.wind, settings) : metric === 'rain' ? it.pop * 100 : (it.uv ?? 0));
    const vals = items.map(value);
    let lo = Math.min(...vals);
    let hi = Math.max(...vals);
    if (metric === 'rain') {
      lo = 0;
      hi = 100;
    } else if (metric === 'uv') {
      lo = 0;
      hi = Math.max(hi, 6);
    } else if (metric === 'wind') {
      lo = 0;
      hi = Math.max(hi, 1);
    }
    const span = hi - lo || 1;
    const pts = items.map((_, i) => [i * COL + COL / 2, PAD_T + (1 - (vals[i] - lo) / span) * plotH] as [number, number]);
    const labels = items.map((it, i) => {
      if (metric === 'temp') return `${Math.round(vals[i])}°`;
      if (metric === 'wind') return `${Math.round(vals[i])}`;
      if (metric === 'rain') return it.type === 'hour' || it.type === 'now' ? `${Math.round(vals[i] / 5) * 5}%` : '';
      return it.uv == null || it.type === 'sunrise' || it.type === 'sunset' ? '' : `${Math.round(it.uv)}`;
    });
    return { pts, labels, line: metric === 'temp' || metric === 'wind' };
  }, [items, metric, settings, plotH]);

  const path = smoothPath(pts);
  const area = path ? `${path} L ${pts[pts.length - 1][0]} ${CHART_H} L ${pts[0][0]} ${CHART_H} Z` : '';

  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto overscroll-x-contain px-4" onPointerDown={(e) => e.stopPropagation()} style={{ touchAction: 'pan-x pan-y' }}>
      <div className="relative" style={{ width: W }}>
        {/* time + icon row */}
        <div className="flex">
          {items.map((it, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5" style={{ width: COL }}>
              <span className={`tnum text-[13px] font-semibold ${it.type === 'now' ? 'text-white' : 'text-white/65'}`}>
                {it.type === 'now' ? 'Now' : it.type === 'hour' ? fmtHour(it.t, offset, settings) : fmtTime(it.t, offset, settings)}
              </span>
              <div className="grid h-8 place-items-center">
                {it.type === 'sunrise' ? (
                  <Sunrise size={22} className="text-amber-300" />
                ) : it.type === 'sunset' ? (
                  <Sunset size={22} className="text-orange-300" />
                ) : (
                  it.cond && <WeatherIcon kind={it.cond.kind} isDay={it.cond.isDay} size={30} animated={it.type === 'now'} />
                )}
              </div>
              <span className="h-3.5 text-[11px] font-semibold text-sky-300">
                {(it.type === 'hour' || it.type === 'now') && it.pop >= 0.2 && metric !== 'rain' ? `${Math.round(it.pop * 10) * 10}%` : it.type === 'sunrise' || it.type === 'sunset' ? <span className="text-white/45">{it.type === 'sunrise' ? 'Rise' : 'Set'}</span> : ''}
              </span>
            </div>
          ))}
        </div>

        {/* chart */}
        <div className="relative mt-1" style={{ height: CHART_H }}>
          <svg width={W} height={CHART_H} className="absolute inset-0 overflow-visible">
            <defs>
              <linearGradient id={`stroke-${gid}`} x1="0" x2={W} y1="0" y2="0" gradientUnits="userSpaceOnUse">
                {items.map((it, i) => (
                  <stop key={i} offset={`${((i * COL + COL / 2) / W) * 100}%`} stopColor={metric === 'temp' ? tempColor(it.temp) : '#a5d8ff'} />
                ))}
              </linearGradient>
              <linearGradient id={`fill-${gid}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {line ? (
              <>
                <motion.path key={`a-${metric}`} d={area} fill={`url(#fill-${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
                <motion.path
                  key={`l-${metric}`}
                  d={path}
                  fill="none"
                  stroke={`url(#stroke-${gid})`}
                  strokeWidth={3}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
                {pts.map(([x, y], i) => (
                  <motion.circle
                    key={`${metric}-${i}`}
                    cx={x}
                    cy={y}
                    r={items[i].type === 'now' ? 4.5 : 2.6}
                    fill={items[i].type === 'now' ? '#fff' : metric === 'temp' ? tempColor(items[i].temp) : '#a5d8ff'}
                    stroke={items[i].type === 'now' ? 'rgba(255,255,255,0.35)' : 'none'}
                    strokeWidth={6}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.025, type: 'spring', stiffness: 300, damping: 18 }}
                  />
                ))}
              </>
            ) : (
              items.map((it, i) => {
                if (it.type === 'sunrise' || it.type === 'sunset') return null;
                const v = metric === 'rain' ? it.pop : Math.min(1, (it.uv ?? 0) / 11);
                const h = Math.max(3, v * plotH);
                const color = metric === 'rain' ? `rgba(96,165,250,${0.35 + it.pop * 0.6})` : uvInfo(it.uv ?? 0).color;
                return (
                  <motion.rect
                    key={`${metric}-${i}`}
                    x={i * COL + COL / 2 - 9}
                    y={PAD_T + plotH - h}
                    width={18}
                    height={h}
                    rx={6}
                    fill={color}
                    style={{ originY: 1, transformBox: 'fill-box' } as any}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.025, type: 'spring', stiffness: 200, damping: 22 }}
                  />
                );
              })
            )}
          </svg>

          {/* value labels */}
          {pts.map(([x, y], i) => {
            const it = items[i];
            const top = line ? y - 22 : metric === 'rain' ? PAD_T + plotH - Math.max(3, it.pop * plotH) - 20 : PAD_T + plotH - Math.max(3, Math.min(1, (it.uv ?? 0) / 11) * plotH) - 20;
            if (!labels[i]) return null;
            return (
              <motion.div
                key={`${metric}-lbl-${i}`}
                className="tnum absolute flex -translate-x-1/2 items-center gap-0.5 text-[13px] font-semibold"
                style={{ left: x, top }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.02 }}
              >
                {metric === 'wind' && <Navigation2 size={10} className="text-white/60" style={{ transform: `rotate(${it.windDeg + 180}deg)` }} />}
                {labels[i]}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(HourlyStrip);
