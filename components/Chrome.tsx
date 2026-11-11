import React, { useState } from 'react';
import { motion, MotionValue, useMotionValueEvent, useScroll, useTransform, LayoutGroup } from 'framer-motion';
import { List, Navigation, Settings2, Share2, Sun } from 'lucide-react';
import { Forecast, Place, Settings } from '../lib/model';
import { fmtTemp } from '../lib/format';
import { tap } from '../lib/haptics';
import { CURRENT_ID } from '../state/locations';
import { IconButton, spring } from './ui';
import WeatherIcon from './WeatherIcon';

// ------------------------------------------------------------------ compact header (appears on scroll)

export const CompactHeader: React.FC<{ place: Place | null; data: Forecast | null; settings: Settings }> = ({ place, data, settings }) => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [170, 240], [0, 1], { clamp: true });
  const y = useTransform(scrollY, [170, 240], [-8, 0], { clamp: true });
  const [visible, setVisible] = useState(() => window.scrollY > 170);
  // only touch React state when crossing the threshold, not on every scroll event
  useMotionValueEvent(scrollY, 'change', (v) => {
    const next = v > 170;
    setVisible((prev) => (prev === next ? prev : next));
  });
  if (!place) return null;
  return (
    // hidden (not just transparent) when off, so its backdrop blur costs nothing while you read
    <header className="fixed inset-x-0 top-0 z-30" style={{ visibility: visible ? 'visible' : 'hidden' }}>
      {/* opacity lives on the blurred element itself; a fading parent would break the blur */}
      <motion.div style={{ opacity }} className="glass-strong border-x-0 border-t-0 pt-safe">
        <motion.div style={{ y }} className="mx-auto flex h-12 max-w-xl items-center justify-center gap-2 px-4 text-[15px] font-semibold">
          <span className="truncate">{place.name}</span>
          {data && (
            <>
              <span className="text-white/35">·</span>
              <span className="tnum">{fmtTemp(data.current.temp, settings)}</span>
              <WeatherIcon kind={data.current.condition.kind} isDay={data.current.condition.isDay} size={22} />
              <span className="truncate font-medium text-white/65">{data.current.condition.label}</span>
            </>
          )}
        </motion.div>
      </motion.div>
    </header>
  );
};

// ------------------------------------------------------------------ pull-to-refresh indicator

export const PullIndicator: React.FC<{ pull: MotionValue<number>; refreshing: boolean; threshold: number }> = ({ pull, refreshing, threshold }) => {
  const y = useTransform(pull, (p) => p - 46);
  const opacity = useTransform(pull, [0, 30, threshold], [0, 0.5, 1]);
  const rotate = useTransform(pull, (p) => p * 3.2);
  const scale = useTransform(pull, [0, threshold], [0.6, 1]);
  return (
    <motion.div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center pt-safe" style={{ y, opacity }}>
      <motion.div style={{ scale }} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[rgb(20,27,48)] shadow-lg">
        <motion.div style={{ rotate: refreshing ? undefined : rotate }} className={refreshing ? 'animate-[spin_1s_linear_infinite]' : ''}>
          <Sun size={20} className="text-amber-200" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// ------------------------------------------------------------------ bottom dock

interface DockProps {
  places: Place[];
  activeIndex: number;
  onSelect: (i: number) => void;
  onLocations: () => void;
  onSettings: () => void;
  onShare: () => void;
}

export const BottomDock: React.FC<DockProps> = ({ places, activeIndex, onSelect, onLocations, onSettings, onShare }) => (
  <motion.nav
    initial={{ y: 90, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ ...spring, delay: 0.4 }}
    className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-safe"
  >
    <div className="glass-strong flex h-14 w-full max-w-md items-center justify-between rounded-full px-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
      <IconButton label="Settings" onClick={onSettings}>
        <Settings2 size={20} />
      </IconButton>
      <LayoutGroup>
        <div className="no-scrollbar flex max-w-[50%] items-center gap-1.5 overflow-x-auto px-1">
          {places.map((p, i) => (
            <button
              key={p.id}
              aria-label={`Show ${p.name}`}
              onClick={() => {
                tap(6);
                onSelect(i);
              }}
              className="relative grid h-6 min-w-3 place-items-center"
            >
              {i === activeIndex ? (
                <motion.span layoutId="dock-dot" transition={spring} className="block h-2 w-5 rounded-full bg-white" />
              ) : p.id === CURRENT_ID ? (
                <Navigation size={9} className="fill-white/40 text-white/40" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-white/35" />
              )}
            </button>
          ))}
        </div>
      </LayoutGroup>
      <div className="flex">
        <IconButton label="Share" onClick={onShare}>
          <Share2 size={19} />
        </IconButton>
        <IconButton label="Locations" onClick={onLocations}>
          <List size={21} />
        </IconButton>
      </div>
    </div>
  </motion.nav>
);
