import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Settings } from '../lib/model';
import { load, remove, save } from '../lib/storage';
import { setHaptics } from '../lib/haptics';

const lowEndDevice = () => {
  // iOS Safari under-reports cores, so only treat clearly weak devices as low-end
  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = (navigator as any).deviceMemory ?? 8;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return reduced || cores <= 2 || mem <= 2;
};

/** Metric everywhere by default (°C, km/h, hPa, mm, km). */
const defaults = (): Settings => ({
  temp: 'c',
  wind: 'kmh',
  pressure: 'hpa',
  precip: 'mm',
  distance: 'km',
  time: 'auto',
  effects: lowEndDevice() ? 'lite' : 'full',
  haptics: true,
});

// Only the choices a user actually made are stored, so future default changes still apply.
const PREFS_KEY = 'prefs.v2';

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<Ctx | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [overrides, setOverrides] = useState<Partial<Settings>>(() => {
    remove('settings'); // v4.0 stored a full snapshot including old defaults
    return load<Partial<Settings>>(PREFS_KEY, {});
  });
  const settings = useMemo<Settings>(() => ({ ...defaults(), ...overrides }), [overrides]);

  useEffect(() => {
    save(PREFS_KEY, overrides);
  }, [overrides]);

  useEffect(() => {
    setHaptics(settings.haptics);
    document.documentElement.classList.toggle('lite', settings.effects === 'lite');
  }, [settings.haptics, settings.effects]);

  const value = useMemo(() => ({ settings, update: (patch: Partial<Settings>) => setOverrides((o) => ({ ...o, ...patch })) }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings outside provider');
  return ctx;
};
