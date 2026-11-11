import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sunrise, Sunset } from 'lucide-react';
import { Forecast, Settings } from '../lib/model';
import { fmtDuration, fmtTime, localMidnight } from '../lib/format';
import { sunAltitude, sunTimes } from '../lib/astro';
import { Card } from './ui';

interface AstroPanelProps {
  data: Forecast;
  settings: Settings;
  delay?: number;
}

const W = 320;
const H = 112;
const HORIZON = 70;

/** Real solar-altitude curve for today, with the sun's live position and golden hour. */
const AstroPanel: React.FC<AstroPanelProps> = ({ data, settings, delay }) => {
  const now = Date.now() / 1000;
  const { offset, lat, lon } = data;
  const st = sunTimes(Date.now(), lat, lon);
  const tomorrow = sunTimes(Date.now() + 86400000, lat, lon);
  const isDay = now >= st.sunrise && now < st.sunset;
  const midnight = localMidnight(now, offset);

  const { path, dayPath, peak, toXY } = useMemo(() => {
    const samples = 72;
    const alts: number[] = [];
    for (let i = 0; i <= samples; i++) alts.push(sunAltitude((midnight + (i / samples) * 86400) * 1000, lat, lon));
    const peak = Math.max(...alts.map(Math.abs), 10);
    const toXY = (t: number) => {
      const x = ((t - midnight) / 86400) * W;
      const alt = sunAltitude(t * 1000, lat, lon);
      const y = alt >= 0 ? HORIZON - (alt / peak) * (HORIZON - 12) : HORIZON - (alt / peak) * (H - HORIZON - 6);
      return [x, y] as [number, number];
    };
    const pts = alts.map((_, i) => toXY(midnight + (i / samples) * 86400));
    const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const above = pts.filter(([, y]) => y <= HORIZON);
    const dayPath = above.length ? `M ${above[0][0]} ${HORIZON} ` + above.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ` L ${above[above.length - 1][0]} ${HORIZON} Z` : '';
    return { path, dayPath, peak, toXY };
  }, [midnight, lat, lon]);

  const [sx, sy] = toXY(now);
  const polar = !Number.isFinite(st.sunrise);
  const next = isDay ? st.sunset : now < st.sunrise ? st.sunrise : tomorrow.sunrise;
  const until = next - now;

  return (
    <Card title={isDay ? 'Sun' : 'Sunrise'} icon={isDay ? <Sunset size={13} /> : <Sunrise size={13} />} delay={delay} className="col-span-2" right={!polar ? `${fmtDuration(st.sunset - st.sunrise)} of daylight` : undefined}>
      {!polar && (
        <div className="mb-1 text-[22px] font-semibold tracking-tight">
          {isDay ? 'Sunset' : 'Sunrise'} {fmtTime(next, offset, settings)}
          <span className="ml-2 text-[13px] font-medium text-white/55">in {fmtDuration(until)}</span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height: 'auto' }}>
        <defs>
          <linearGradient id="dayfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="elapsed">
            <rect x="0" y="0" width={Math.max(0, sx)} height={H} />
          </clipPath>
          <radialGradient id="sunball">
            <stop offset="0%" stopColor="#fffbea" />
            <stop offset="60%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>
        <rect x="0" y={HORIZON} width={W} height={H - HORIZON} fill="rgba(0,0,0,0.18)" rx="4" />
        {dayPath && <path d={dayPath} fill="url(#dayfill)" clipPath="url(#elapsed)" />}
        <path d={path} fill="none" stroke="white" strokeOpacity={0.3} strokeWidth={1.6} strokeDasharray="3 4" />
        <motion.path d={path} fill="none" stroke="#fde68a" strokeWidth={2.4} strokeLinecap="round" clipPath="url(#elapsed)" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />
        <line x1="0" x2={W} y1={HORIZON} y2={HORIZON} stroke="white" strokeOpacity={0.35} strokeWidth={1} />
        <motion.g initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.9, type: 'spring', stiffness: 200, damping: 14 }} style={{ originX: `${sx}px`, originY: `${sy}px` }}>
          {sy <= HORIZON && <circle cx={sx} cy={sy} r={16} fill="#fcd34d" opacity={0.25} />}
          <circle cx={sx} cy={sy} r={7} fill={sy <= HORIZON ? 'url(#sunball)' : '#94a3b8'} stroke="white" strokeOpacity={0.9} strokeWidth={1.5} />
        </motion.g>
      </svg>
      {!polar && (
        <div className="tnum mt-2 grid grid-cols-3 text-[12px] text-white/60">
          <div>
            <div className="label !text-[10px]">Sunrise</div>
            <div className="mt-0.5 text-[14px] font-semibold text-white">{fmtTime(st.sunrise, offset, settings)}</div>
          </div>
          <div className="text-center">
            <div className="label !text-[10px]">Golden hour</div>
            <div className="mt-0.5 text-[14px] font-semibold text-amber-200">{Number.isFinite(st.goldenEveningStart) ? fmtTime(st.goldenEveningStart, offset, settings) : '—'}</div>
          </div>
          <div className="text-right">
            <div className="label !text-[10px]">Sunset</div>
            <div className="mt-0.5 text-[14px] font-semibold text-white">{fmtTime(st.sunset, offset, settings)}</div>
          </div>
        </div>
      )}
      {polar && <p className="text-[14px] text-white/70">{peak > 0 && sunAltitude(Date.now(), lat, lon) > 0 ? 'Midnight sun — the sun stays up all day.' : 'Polar night — the sun stays below the horizon.'}</p>}
    </Card>
  );
};

export default AstroPanel;
