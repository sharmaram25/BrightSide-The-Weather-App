import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { fetchAirQuality, fetchAirQualityForecast, fetchExtras, fetchForecastByCoords, fetchWeatherByCoords } from '../services/api';
import { Forecast, Place } from '../lib/model';
import { normalize } from '../lib/normalize';
import { load, save } from '../lib/storage';

const CACHE_VERSION = 'v4';
const STALE_MS = 10 * 60 * 1000;

export interface Entry {
  data: Forecast | null;
  loading: boolean;
  error: string | null;
}

const empty: Entry = { data: null, loading: false, error: null };
const entries = new Map<string, Entry>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

export const placeKey = (p: Pick<Place, 'lat' | 'lon'>) => `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`;

const emit = () => listeners.forEach((l) => l());

const get = (key: string): Entry => {
  let e = entries.get(key);
  if (!e) {
    const cached = load<Forecast | null>(`fc:${CACHE_VERSION}:${key}`, null);
    e = { ...empty, data: cached };
    entries.set(key, e);
  }
  return e;
};

const set = (key: string, patch: Partial<Entry>) => {
  entries.set(key, { ...get(key), ...patch });
  emit();
};

export const loadForecast = (place: Pick<Place, 'lat' | 'lon'>, force = false): Promise<void> => {
  const key = placeKey(place);
  const entry = get(key);
  if (!force && entry.data && Date.now() - entry.data.fetchedAt < STALE_MS) return Promise.resolve();
  const existing = inflight.get(key);
  if (existing) return existing;

  const { lat, lon } = place;
  set(key, { loading: true, error: null });
  const p = (async () => {
    try {
      const [weather, forecast] = await Promise.all([fetchWeatherByCoords(lat, lon), fetchForecastByCoords(lat, lon)]);
      const [air, airFc, extras] = await Promise.allSettled([fetchAirQuality(lat, lon), fetchAirQualityForecast(lat, lon), fetchExtras(lat, lon)]);
      const value = <T,>(r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? r.value : null);
      const data = normalize(weather, forecast, value(air), value(airFc), value(extras));
      save(`fc:${CACHE_VERSION}:${key}`, data);
      set(key, { data, loading: false, error: null });
    } catch (err) {
      set(key, { loading: false, error: navigator.onLine ? (err as Error).message : 'You are offline' });
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useForecast = (place: Place | null) => {
  const key = place ? placeKey(place) : '';
  const entry = useSyncExternalStore(subscribe, () => (key ? get(key) : empty));
  useEffect(() => {
    if (place) loadForecast(place);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const refresh = useCallback(() => (place ? loadForecast(place, true) : Promise.resolve()), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...entry, refresh };
};

/** Read-only peek used by the locations list. */
export const usePeek = (place: Place) => {
  const key = placeKey(place);
  return useSyncExternalStore(subscribe, () => get(key)).data;
};

export const forgetForecast = (place: Place) => {
  entries.delete(placeKey(place));
};
