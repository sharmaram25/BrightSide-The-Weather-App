import React from 'react';
import { motion } from 'framer-motion';
import { Umbrella } from 'lucide-react';
import { Forecast, Settings } from '../lib/model';
import { nowcastSummary } from '../lib/insights';
import { fmtTime } from '../lib/format';
import { Card } from './ui';

/** Next-two-hours precipitation, 15-minute resolution. Only rendered when rain is near. */
const Nowcast: React.FC<{ data: Forecast; settings: Settings }> = ({ data, settings }) => {
  const nc = nowcastSummary(data.nowcast);
  if (!nc) return null;
  const max = Math.max(0.6, ...nc.points.map((p) => p.precip));
  const intensity = (mm: number) => (mm * 4 >= 7.6 ? 'Heavy' : mm * 4 >= 2.5 ? 'Moderate' : 'Light');
  const peak = nc.points.reduce((a, b) => (b.precip > a.precip ? b : a));

  return (
    <Card title="Precipitation" icon={<Umbrella size={13} />} right={`${intensity(peak.precip)} at peak`}>
      <p className="mb-4 text-[17px] font-semibold leading-snug">{nc.title}</p>
      <div className="flex h-20 items-end gap-1.5">
        {nc.points.map((p, i) => (
          <div key={p.time} className="flex h-full flex-1 flex-col justify-end">
            <motion.div
              className="w-full rounded-full"
              style={{ background: 'linear-gradient(180deg, #93c5fd, #3b82f6)', originY: 1 }}
              initial={{ scaleY: 0, opacity: 0.4 }}
              whileInView={{ scaleY: 1, opacity: p.precip > 0.02 ? 1 : 0.35 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
            >
              <div style={{ height: `${Math.max(4, (p.precip / max) * 80)}px` }} />
            </motion.div>
          </div>
        ))}
      </div>
      <div className="tnum mt-2 flex justify-between text-[11px] font-medium text-white/50">
        <span>Now</span>
        <span>{fmtTime(nc.points[Math.floor(nc.points.length / 2)].time, data.offset, settings)}</span>
        <span>{fmtTime(nc.points[nc.points.length - 1].time, data.offset, settings)}</span>
      </div>
    </Card>
  );
};

export default React.memo(Nowcast);
