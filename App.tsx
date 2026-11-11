import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionConfig, PanInfo, useReducedMotion, useTransform } from 'framer-motion';
import { CloudOff, RotateCw } from 'lucide-react';
import { SettingsProvider, useSettings } from './state/settings';
import { CURRENT_ID, LocationsProvider, useLocations } from './state/locations';
import { loadForecast, useForecast } from './state/weatherStore';
import { sceneFor } from './lib/sky';
import { fmtTemp, relativeMinutes } from './lib/format';
import { tap } from './lib/haptics';
import { useNow } from './hooks/useNow';
import { useOnline } from './hooks/useOnline';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { ToastProvider, useToast } from './components/ui';
import Background from './components/Background';
import CurrentWeather from './components/CurrentWeather';
import Nowcast from './components/Nowcast';
import WeatherInsights from './components/WeatherInsights';
import Forecast from './components/Forecast';
import DailyForecast from './components/DailyForecast';
import DetailsGrid from './components/DetailsGrid';
import ActivityGuide from './components/ActivityGuide';
import { Forecast as ForecastData, Place, Settings } from './lib/model';

// Sheets are split out of the initial bundle and preloaded when the browser is idle
const loadDaySheet = () => import('./components/DaySheet');
const loadLocationsSheet = () => import('./components/LocationsSheet');
const loadSettingsSheet = () => import('./components/SettingsSheet');
const DaySheet = lazy(loadDaySheet);
const LocationsSheet = lazy(loadLocationsSheet);
const SettingsSheet = lazy(loadSettingsSheet);
import { BottomDock, CompactHeader, PullIndicator } from './components/Chrome';
import { ErrorState, Skeleton } from './components/States';

const DEFAULT_SKY: [string, string, string] = ['#0b1530', '#1c2b4d', '#2b3a5e'];

/** The scrolling content for one location. Memoized so sheets, pull-to-refresh and
 *  status changes don't re-render (and re-animate) every card. */
const Dashboard = React.memo(function Dashboard({ data, place, settings, onSelectDay }: { data: ForecastData; place: Place; settings: Settings; onSelectDay: (i: number) => void }) {
  return (
    <>
      <CurrentWeather data={data} place={place} isCurrent={place.id === CURRENT_ID} settings={settings} />
      <StatusSlot />
      <div className="grid items-start gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        <div className="flex min-w-0 flex-col gap-3">
          <Nowcast data={data} settings={settings} />
          <WeatherInsights data={data} settings={settings} />
          <Forecast data={data} settings={settings} />
          <DailyForecast data={data} settings={settings} onSelect={onSelectDay} />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <DetailsGrid data={data} settings={settings} />
          <ActivityGuide data={data} settings={settings} />
        </div>
      </div>
      <p className="mt-8 text-center text-[10px] leading-relaxed text-white/30">
        OpenWeather{data.hasExtras ? ' · Open-Meteo' : ''} · {data.lat.toFixed(2)}, {data.lon.toFixed(2)}
      </p>
    </>
  );
});

interface Status {
  online: boolean;
  loading: boolean;
  error: string | null;
  fetchedAt: number;
  refresh: () => void;
}

/** Status pill reads from context so its updates never re-render the dashboard. */
const StatusCtx = React.createContext<Status | null>(null);
const StatusSlot: React.FC = () => {
  const s = React.useContext(StatusCtx);
  if (!s) return null;
  return (
    <div className="mb-3 flex justify-center">
      <button onClick={s.refresh} className="press flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1 text-[11px] font-medium text-white/55 active:bg-black/25">
        {!s.online ? <CloudOff size={11} /> : <RotateCw size={11} className={s.loading ? 'animate-spin' : ''} />}
        {!s.online ? 'Offline · ' : s.error ? 'Couldn’t refresh · ' : ''}
        {s.loading ? 'Updating…' : `Updated ${relativeMinutes(s.fetchedAt)}`}
      </button>
    </div>
  );
};

const Main: React.FC = () => {
  const { settings } = useSettings();
  const toast = useToast();
  const { places, active, activeIndex, step, setActive, geoStatus } = useLocations();
  const { data, loading, error, refresh } = useForecast(active);
  const online = useOnline();
  const now = useNow(60000);
  const reduced = useReducedMotion();
  const [dir, setDir] = useState(1);
  const [sheet, setSheet] = useState<null | 'locations' | 'settings'>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState({ locations: false, settings: false });
  const openSheet = useCallback((s: 'locations' | 'settings') => {
    setMounted((m) => (m[s] ? m : { ...m, [s]: true }));
    setSheet(s);
  }, []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const closeDay = useCallback(() => setDayIndex(null), []);

  const hasData = !!data;
  useEffect(() => {
    if (!hasData) return;
    const idle: (cb: () => void) => void = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
    idle(() => {
      loadDaySheet();
      loadLocationsSheet();
      loadSettingsSheet();
    });
  }, [hasData]);

  const sky = useMemo(() => (data ? sceneFor(data, settings.effects === 'lite', !!reduced) : null), [data, settings.effects, reduced, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const doRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);
  const { pull, refreshing, threshold } = usePullToRefresh(doRefresh, !sheet && dayIndex === null);
  const contentY = useTransform(pull, (p) => p * 0.55);

  // Refresh when returning to the app, and every 15 minutes while visible
  useEffect(() => {
    if (!active) return;
    const onVis = () => document.visibilityState === 'visible' && loadForecast(active);
    document.addEventListener('visibilitychange', onVis);
    const iv = setInterval(() => document.visibilityState === 'visible' && loadForecast(active), 15 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(iv);
    };
  }, [active]);

  // Always start a newly shown location at the top
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [active?.id]);

  const go = (d: 1 | -1) => {
    setDir(d);
    if (step(d)) {
      tap(8);
      window.scrollTo({ top: 0 });
    }
  };

  const selectIndex = (i: number) => {
    if (i === activeIndex) return;
    setDir(i > activeIndex ? 1 : -1);
    setActive(places[i].id);
    window.scrollTo({ top: 0 });
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -500) go(1);
    else if (info.offset.x > 80 || info.velocity.x > 500) go(-1);
  };

  const share = async () => {
    if (!data || !active) return;
    const text = `${active.name}: ${fmtTemp(data.current.temp, settings)} and ${data.current.condition.label.toLowerCase()} · H ${fmtTemp(data.daily[0].tMax, settings)} L ${fmtTemp(data.daily[0].tMin, settings)} — via BrightSide`;
    try {
      if (navigator.share) await navigator.share({ title: 'BrightSide', text, url: location.origin });
      else {
        await navigator.clipboard.writeText(`${text} ${location.origin}`);
        toast('Copied to clipboard');
      }
    } catch {
      /* user cancelled */
    }
  };

  const fetchedAt = data?.fetchedAt ?? 0;
  const status = useMemo<Status | null>(
    () => (fetchedAt ? { online, loading, error, fetchedAt, refresh: () => void refresh() } : null),
    [online, loading, error, fetchedAt, refresh, now] // eslint-disable-line react-hooks/exhaustive-deps
  );

  let content: React.ReactNode;
  if (!active) content = <Skeleton label={geoStatus === 'pending' ? 'Finding your location…' : undefined} />;
  else if (!data && error) content = <ErrorState error={error} onRetry={refresh} />;
  else if (!data) content = <Skeleton />;
  else content = <Dashboard data={data} place={active} settings={settings} onSelectDay={setDayIndex} />;

  return (
    <>
      <Background palette={sky?.palette ?? DEFAULT_SKY} scene={sky?.scene ?? null} throttle={sheet !== null || dayIndex !== null} />
      <PullIndicator pull={pull} refreshing={refreshing} threshold={threshold} />
      <CompactHeader place={active} data={data} settings={settings} />

      <motion.main style={{ y: contentY }} className="relative mx-auto min-h-dvh max-w-xl px-4 pt-safe pb-[calc(max(env(safe-area-inset-bottom),12px)+88px)] lg:max-w-5xl">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={active?.id ?? 'none'}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d * 48, opacity: 0 }),
              center: { x: 0, opacity: 1, transition: { x: { type: 'spring', stiffness: 420, damping: 40 }, opacity: { duration: 0.22 } } },
              exit: (d: number) => ({ x: d * -48, opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            drag={places.length > 1 ? 'x' : false}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.16}
            onDragEnd={onDragEnd}
            style={{ touchAction: 'pan-y' }}
          >
            <StatusCtx.Provider value={status}>{content}</StatusCtx.Provider>
          </motion.div>
        </AnimatePresence>
      </motion.main>

      <BottomDock places={places} activeIndex={activeIndex} onSelect={selectIndex} onLocations={() => openSheet('locations')} onSettings={() => openSheet('settings')} onShare={share} />

      <Suspense fallback={null}>
        {mounted.locations && <LocationsSheet open={sheet === 'locations'} onClose={closeSheet} settings={settings} />}
        {mounted.settings && <SettingsSheet open={sheet === 'settings'} onClose={closeSheet} />}
        {data && <DaySheet data={data} settings={settings} index={dayIndex} onIndex={setDayIndex} onClose={closeDay} />}
      </Suspense>
    </>
  );
};

const WithLocations: React.FC = () => {
  const toast = useToast();
  return (
    <LocationsProvider onNotice={toast}>
      <Main />
    </LocationsProvider>
  );
};

const App: React.FC = () => (
  <MotionConfig reducedMotion="user">
    <ToastProvider>
      <SettingsProvider>
        <WithLocations />
      </SettingsProvider>
    </ToastProvider>
  </MotionConfig>
);

export default App;
