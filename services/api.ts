import { WeatherData, ForecastData, AirQualityData, GeoResult, ExtrasData } from '../types';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const requireApiKey = () => {
  if (!API_KEY) {
    throw new Error('Missing OpenWeather API key. Set VITE_OPENWEATHER_API_KEY in your .env.local');
  }
  return API_KEY;
};

export const fetchWeather = async (city: string): Promise<WeatherData> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${apiKey}`);
  if (!response.ok) {
    throw new Error('City not found');
  }
  return response.json();
};

export const fetchWeatherByCoords = async (lat: number, lon: number): Promise<WeatherData> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
  if (!response.ok) {
    throw new Error('Could not fetch weather data');
  }
  return response.json();
};

export const fetchForecast = async (city: string): Promise<ForecastData> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${apiKey}`);
  if (!response.ok) {
    throw new Error('Forecast not available');
  }
  return response.json();
};

export const fetchForecastByCoords = async (lat: number, lon: number): Promise<ForecastData> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
  if (!response.ok) {
    throw new Error('Forecast not available');
  }
  return response.json();
};

export const fetchAirQuality = async (lat: number, lon: number): Promise<AirQualityData> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
  if (!response.ok) {
    throw new Error('Air quality data unavailable');
  }
  return response.json();
};
// ---------------------------------------------------------------------------
// Additions for BrightSide v4 (the functions above are unchanged)
// ---------------------------------------------------------------------------

const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

/** City autocomplete via the OpenWeather Geocoding API (same API key). */
export const searchCities = async (query: string, signal?: AbortSignal): Promise<GeoResult[]> => {
  const apiKey = requireApiKey();
  const response = await fetch(
    `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=6&appid=${apiKey}`,
    { signal }
  );
  if (!response.ok) {
    throw new Error('Search unavailable');
  }
  return response.json();
};

/** Name for a coordinate pair (used for "My Location"). */
export const reverseGeocode = async (lat: number, lon: number): Promise<GeoResult | null> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`);
  if (!response.ok) {
    return null;
  }
  const results: GeoResult[] = await response.json();
  return results[0] ?? null;
};

/** Hourly air quality forecast (~4 days) from OpenWeather. */
export const fetchAirQualityForecast = async (lat: number, lon: number): Promise<AirQualityData> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${BASE_URL}/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`);
  if (!response.ok) {
    throw new Error('Air quality forecast unavailable');
  }
  return response.json();
};

/**
 * Optional, keyless enrichment from Open-Meteo for data the OpenWeather free
 * tier lacks: UV index, extended outlook (days 6-10) and a 15-minute
 * precipitation nowcast. Callers must treat failure as "no extras".
 */
export const fetchExtras = async (lat: number, lon: number): Promise<ExtrasData> => {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: 'uv_index',
    hourly: 'uv_index',
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'uv_index_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant',
      'sunrise',
      'sunset',
    ].join(','),
    minutely_15: 'precipitation',
    forecast_minutely_15: '12',
    forecast_days: '10',
    wind_speed_unit: 'ms',
    timeformat: 'unixtime',
    timezone: 'auto',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) {
    throw new Error('Extras unavailable');
  }
  return response.json();
};
