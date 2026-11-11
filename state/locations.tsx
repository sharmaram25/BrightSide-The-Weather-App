import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Place } from '../lib/model';
import { load, save } from '../lib/storage';
import { reverseGeocode } from '../services/api';
import { forgetForecast, loadForecast } from './weatherStore';

export const CURRENT_ID = 'current';
const FALLBACK: Place = { id: 'london-gb', name: 'London', region: 'England', country: 'GB', lat: 51.5074, lon: -0.1278 };

type GeoStatus = 'pending' | 'granted' | 'denied' | 'unavailable';

interface Ctx {
  places: Place[]; // current location first (if available), then saved
  saved: Place[];
  active: Place | null;
  activeIndex: number;
  geoStatus: GeoStatus;
  setActive: (id: string) => void;
  step: (dir: 1 | -1) => boolean;
  add: (p: Place) => void;
  remove: (id: string) => void;
  reorder: (saved: Place[]) => void;
  locate: () => void;
}

const LocationsContext = createContext<Ctx | null>(null);

const distanceKm = (a: Place, b: { lat: number; lon: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const LocationsProvider: React.FC<{ children: React.ReactNode; onNotice?: (msg: string) => void }> = ({ children, onNotice }) => {
  const [saved, setSaved] = useState<Place[]>(() => load('saved', []));
  const [current, setCurrent] = useState<Place | null>(() => load('current', null));
  const [activeId, setActiveId] = useState<string>(() => load('active', CURRENT_ID));
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('pending');
  const noticeRef = useRef(onNotice);
  noticeRef.current = onNotice;

  useEffect(() => save('saved', saved), [saved]);
  useEffect(() => save('current', current), [current]);
  useEffect(() => save('active', activeId), [activeId]);

  const places = useMemo(() => (current && geoStatus !== 'denied' ? [current, ...saved] : saved), [current, saved, geoStatus]);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('unavailable');
      return;
    }
    setGeoStatus('pending');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4) };
        setGeoStatus('granted');
        setCurrent((prev) => {
          if (prev && distanceKm(prev, coords) < 1.5) return prev;
          return { id: CURRENT_ID, name: prev?.name ?? 'My Location', country: prev?.country ?? '', ...coords };
        });
        try {
          const geo = await reverseGeocode(coords.lat, coords.lon);
          if (geo) setCurrent((prev) => ({ ...(prev ?? { id: CURRENT_ID, ...coords }), name: geo.name, region: geo.state, country: geo.country, ...coords }));
        } catch {
          /* keep coordinates-only name */
        }
      },
      (err) => {
        setGeoStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 }
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  // First run without location access: fall back to London (as before) so the app is never empty.
  useEffect(() => {
    if (saved.length === 0 && (geoStatus === 'denied' || (geoStatus === 'unavailable' && !current))) {
      setSaved([FALLBACK]);
      setActiveId(FALLBACK.id);
      noticeRef.current?.('Location is off — showing London. Add your city from the list.');
    }
  }, [geoStatus, saved.length, current]);

  // Keep the active id valid
  const activeIndex = Math.max(0, places.findIndex((p) => p.id === activeId));
  const active = places[activeIndex] ?? null;
  useEffect(() => {
    if (active && active.id !== activeId) setActiveId(active.id);
  }, [active, activeId]);

  // Warm the cache for every location so swiping is instant
  useEffect(() => {
    places.forEach((p, i) => setTimeout(() => loadForecast(p), 600 + i * 350));
  }, [places]);

  const value: Ctx = {
    places,
    saved,
    active,
    activeIndex,
    geoStatus,
    setActive: setActiveId,
    step: (dir) => {
      const next = activeIndex + dir;
      if (next < 0 || next >= places.length) return false;
      setActiveId(places[next].id);
      return true;
    },
    add: (p) => {
      setSaved((s) => (s.some((x) => x.id === p.id) ? s : [...s, p]));
      setActiveId(p.id);
    },
    remove: (id) => {
      const p = saved.find((x) => x.id === id);
      if (p) forgetForecast(p);
      setSaved((s) => s.filter((x) => x.id !== id));
    },
    reorder: setSaved,
    locate,
  };

  return <LocationsContext.Provider value={value}>{children}</LocationsContext.Provider>;
};

export const useLocations = () => {
  const ctx = useContext(LocationsContext);
  if (!ctx) throw new Error('useLocations outside provider');
  return ctx;
};

export const placeId = (name: string, country: string, lat: number, lon: number) =>
  `${name}-${country}-${lat.toFixed(2)}-${lon.toFixed(2)}`.toLowerCase().replace(/\s+/g, '-');
