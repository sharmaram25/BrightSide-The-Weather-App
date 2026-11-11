import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Bike, Footprints, Trees, Shirt, Telescope, Camera } from 'lucide-react';
import { Forecast, Settings } from '../lib/model';
import { activities, ActivityScore } from '../lib/insights';
import { Card } from './ui';

interface ActivityGuideProps {
  data: Forecast;
  settings: Settings;
}

const ICONS: Record<ActivityScore['id'], React.ElementType> = {
  run: Footprints,
  cycle: Bike,
  outdoor: Trees,
  laundry: Shirt,
  stars: Telescope,
  photo: Camera,
};

const scoreColor = (s: number) => (s >= 8 ? '#4ade80' : s >= 6 ? '#a3e635' : s >= 4 ? '#facc15' : '#fb7185');

const Ring: React.FC<{ score: number; children: React.ReactNode }> = ({ score, children }) => {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="white" strokeOpacity={0.1} strokeWidth={4} />
        <motion.circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - score / 10) }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-white/85">{children}</div>
    </div>
  );
};

/** Lifestyle forecast: scores for common activities with the best time to do them. */
const ActivityGuide: React.FC<ActivityGuideProps> = ({ data, settings }) => {
  const list = useMemo(() => activities(data, settings), [data, settings]);
  return (
    <Card title="Activity forecast" icon={<Activity size={13} />} right="Next 24h">
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 [&>*]:min-w-0">
        {list.map((a, i) => {
          const Icon = ICONS[a.id];
          return (
            <motion.div key={a.id} className="flex items-center gap-3" initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Ring score={a.score}>
                <Icon size={18} />
              </Ring>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{a.name}</div>
                <div className="text-[12px] font-semibold" style={{ color: scoreColor(a.score) }}>
                  {a.label}
                </div>
                <div className="line-clamp-2 text-[11px] leading-tight text-white/55">{a.note}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};

export default React.memo(ActivityGuide);
