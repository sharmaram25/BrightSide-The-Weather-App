import React, { useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Navigation } from 'lucide-react';
import { Forecast, Place, Settings } from '../lib/model';
import { fmtDate, fmtTemp, fmtTime, toTemp } from '../lib/format';
import { headline } from '../lib/insights';
import { AnimatedNumber, EASE_OUT } from './ui';
import WeatherIcon from './WeatherIcon';

interface Props {
  data: Forecast;
  place: Place;
  isCurrent: boolean;
  settings: Settings;
}

const CurrentWeather: React.FC<Props> = ({ data, place, isCurrent, settings }) => {
  const { current, daily, offset } = data;
  const today = daily[0];
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 220], [1, 0], { clamp: true });
  const scale = useTransform(scrollY, [0, 220], [1, 0.94], { clamp: true });
  const y = useTransform(scrollY, [0, 220], [0, 40], { clamp: true });

  const now = Date.now() / 1000;
  const deviceOffset = -new Date().getTimezoneOffset() * 60;
  const showLocalTime = Math.abs(deviceOffset - offset) >= 1800;
  const summary = useMemo(() => headline(data, settings), [data, settings]);

  // transform + opacity only: both run on the compositor
  const item = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE_OUT, delay: 0.04 + i * 0.06 },
  });

  return (
    <motion.section style={{ opacity, scale, y }} className="flex flex-col items-center px-6 pt-6 pb-8 text-center text-soft-shadow will-change-transform">
      <motion.div {...item(0)} className="flex items-center gap-1.5 text-[26px] font-semibold tracking-tight">
        {isCurrent && <Navigation size={15} className="fill-white/80 text-white/80" />}
        <h1 className="max-w-[78vw] truncate">{place.name}</h1>
      </motion.div>
      <motion.p {...item(1)} className="mt-0.5 text-[13px] font-medium text-white/60">
        {isCurrent ? 'My Location' : fmtDate(now, offset)}
        {showLocalTime && ` · ${fmtTime(now, offset, settings)} local`}
      </motion.p>

      <motion.div {...item(2)} className="relative mt-1 flex items-start justify-center">
        <span className="hero-temp tnum text-[124px] leading-[1.02] md:text-[150px]">
          <AnimatedNumber value={Math.round(toTemp(current.temp, settings))} />
        </span>
        <span className="hero-temp mt-3 text-[72px] leading-none md:text-[88px]">°</span>
      </motion.div>

      <motion.div {...item(3)} className="-mt-1 flex items-center gap-2 text-[19px] font-medium text-white/90">
        <WeatherIcon kind={current.condition.kind} isDay={current.condition.isDay} size={30} animated />
        {current.condition.label}
      </motion.div>

      <motion.div {...item(4)} className="tnum mt-1.5 flex items-center gap-3 text-[15px] font-medium text-white/75">
        <span>H: {fmtTemp(today?.tMax ?? current.temp, settings)}</span>
        <span>L: {fmtTemp(today?.tMin ?? current.temp, settings)}</span>
        <span className="h-3.5 w-px bg-white/25" />
        <span>Feels {fmtTemp(current.feelsLike, settings)}</span>
      </motion.div>

      <motion.p {...item(5)} className="mt-5 max-w-sm text-[15px] leading-snug text-white/85">
        {summary}
      </motion.p>
    </motion.section>
  );
};

export default React.memo(CurrentWeather);
