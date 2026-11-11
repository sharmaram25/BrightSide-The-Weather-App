import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CloudLightning, CloudRain, Flame, Snowflake, Sun, Wind, CloudFog, Leaf, Umbrella, Shirt, SunMedium, Glasses, GlassWater, ShieldPlus, Sparkles } from 'lucide-react';
import { Forecast, Settings } from '../lib/model';
import { alerts, essentials, AlertKind, EssentialId } from '../lib/insights';
import { Card } from './ui';

interface WeatherInsightsProps {
  data: Forecast;
  settings: Settings;
}

const ALERT_ICON: Record<AlertKind, React.ElementType> = {
  heat: Flame,
  uv: Sun,
  wind: Wind,
  rain: CloudRain,
  storm: CloudLightning,
  cold: Snowflake,
  fog: CloudFog,
  air: Leaf,
};

const ESSENTIAL_ICON: Record<EssentialId, React.ElementType> = {
  umbrella: Umbrella,
  jacket: Shirt,
  sunscreen: SunMedium,
  sunglasses: Glasses,
  water: GlassWater,
  mask: ShieldPlus,
};

const LEVEL = {
  severe: { ring: 'from-rose-500/35 to-rose-500/5', icon: 'bg-rose-500/25 text-rose-200' },
  warn: { ring: 'from-amber-400/30 to-amber-400/5', icon: 'bg-amber-400/20 text-amber-200' },
  info: { ring: 'from-sky-400/25 to-sky-400/5', icon: 'bg-sky-400/20 text-sky-200' },
};

/** Weather alerts derived from the forecast + "what to bring today". */
const WeatherInsights: React.FC<WeatherInsightsProps> = ({ data, settings }) => {
  const list = useMemo(() => alerts(data, settings), [data, settings]);
  const kit = useMemo(() => essentials(data), [data]);
  const active = kit.filter((k) => k.active);

  return (
    <>
      {list.length > 0 && (
        <Card title="Heads up" icon={<AlertTriangle size={13} />} right={list.length > 1 ? `${list.length} alerts` : undefined}>
          <div className="space-y-2">
            {list.map((a, i) => {
              const Icon = ALERT_ICON[a.id];
              const lv = LEVEL[a.level];
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 + i * 0.07 }}
                  className={`flex items-start gap-3 rounded-2xl bg-gradient-to-r ${lv.ring} p-3`}
                >
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${lv.icon}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold">{a.title}</div>
                    <div className="text-[13px] leading-snug text-white/70">{a.detail}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      <Card title="Bring today" icon={<Sparkles size={13} />} right={active.length ? undefined : 'Travel light'}>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" onPointerDown={(e) => e.stopPropagation()}>
          {kit.map((k, i) => {
            const Icon = ESSENTIAL_ICON[k.id];
            return (
              <motion.div
                key={k.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`flex min-w-[84px] flex-col items-center rounded-2xl px-2.5 py-3 text-center transition-colors ${k.active ? 'bg-white/[0.14]' : 'bg-white/[0.04]'}`}
              >
                <div className={`mb-1.5 grid h-10 w-10 place-items-center rounded-full ${k.active ? 'bg-white text-slate-900 shadow-[0_6px_20px_-6px_rgba(255,255,255,0.6)]' : 'bg-white/10 text-white/40'}`}>
                  <Icon size={19} />
                </div>
                <div className={`text-[13px] font-semibold ${k.active ? '' : 'text-white/45'}`}>{k.label}</div>
                <div className={`text-[11px] ${k.active ? 'text-white/70' : 'text-white/35'}`}>{k.note}</div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </>
  );
};

export default React.memo(WeatherInsights);
