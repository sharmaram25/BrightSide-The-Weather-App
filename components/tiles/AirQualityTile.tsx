import React from 'react';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { Forecast, Settings } from '../../lib/model';
import { aqiInfo, fmtHour } from '../../lib/format';
import { Card } from '../ui';

// WHO 2021 guideline levels (µg/m³) used to scale the pollutant bars
const POLLUTANTS: { key: 'pm2_5' | 'pm10' | 'o3' | 'no2'; label: string; limit: number }[] = [
  { key: 'pm2_5', label: 'PM2.5', limit: 15 },
  { key: 'pm10', label: 'PM10', limit: 45 },
  { key: 'o3', label: 'O₃', limit: 100 },
  { key: 'no2', label: 'NO₂', limit: 25 },
];

const SEG = ['#4ade80', '#a3e635', '#facc15', '#fb923c', '#f43f5e'];

const AirQualityTile: React.FC<{ data: Forecast; settings: Settings; delay?: number }> = ({ data, settings, delay }) => {
  const air = data.air!;
  const info = aqiInfo(air.aqi);
  const next = air.forecast.slice(0, 24);
  const worst = next.length ? Math.max(...next.map((x) => x.aqi)) : air.aqi;
  const best = next.length ? Math.min(...next.map((x) => x.aqi)) : air.aqi;
  const trend = worst > air.aqi ? `Worsening to ${aqiInfo(worst).label.toLowerCase()} later` : best < air.aqi ? `Improving to ${aqiInfo(best).label.toLowerCase()} later` : 'Holding steady for 24 hours';

  return (
    <Card title="Air quality" icon={<Leaf size={13} />} delay={delay} className="col-span-2" right={trend}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[28px] font-semibold leading-none tracking-tight" style={{ color: info.color }}>
            {info.label}
          </div>
          <p className="mt-1.5 max-w-[16rem] text-[13px] leading-snug text-white/70">{info.advice}</p>
        </div>
        <div className="tnum text-right">
          <div className="text-[34px] font-medium leading-none">{air.aqi}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">of 5</div>
        </div>
      </div>

      {/* 5-step scale */}
      <div className="mt-3.5 grid grid-cols-5 gap-1">
        {SEG.map((c, i) => (
          <motion.div
            key={c}
            className="h-[5px] rounded-full"
            style={{ background: c, originX: 0 }}
            initial={{ scaleX: 0, opacity: 0.3 }}
            whileInView={{ scaleX: 1, opacity: i + 1 === air.aqi ? 1 : 0.28 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}
          />
        ))}
      </div>

      {/* next 24h timeline */}
      {next.length > 6 && (
        <div className="mt-4">
          <div className="flex h-7 items-end gap-[2px]">
            {next.map((x, i) => (
              <motion.div
                key={x.time}
                className="flex-1 rounded-[3px]"
                style={{ background: SEG[x.aqi - 1] ?? '#94a3b8', originY: 1, height: `${30 + x.aqi * 14}%` }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.015, type: 'spring', stiffness: 200, damping: 22 }}
              />
            ))}
          </div>
          <div className="tnum mt-1 flex justify-between text-[10px] font-medium text-white/40">
            <span>Now</span>
            <span>{fmtHour(next[Math.floor(next.length / 2)].time, data.offset, settings)}</span>
            <span>{fmtHour(next[next.length - 1].time, data.offset, settings)}</span>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2">
        {POLLUTANTS.map((p, i) => {
          const v = air[p.key];
          const ratio = v / p.limit;
          const color = ratio < 0.5 ? SEG[0] : ratio < 1 ? SEG[2] : ratio < 2 ? SEG[3] : SEG[4];
          return (
            <div key={p.key} className="rounded-xl bg-white/[0.06] px-2 py-2">
              <div className="text-[10px] font-semibold text-white/50">{p.label}</div>
              <div className="tnum text-[15px] font-semibold">{v < 10 ? v.toFixed(1) : Math.round(v)}</div>
              <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-black/25">
                <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} whileInView={{ width: `${Math.min(100, ratio * 50)}%` }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.08, duration: 0.8 }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-white/35">µg/m³ · bars relative to WHO guideline levels</p>
    </Card>
  );
};

export default AirQualityTile;
