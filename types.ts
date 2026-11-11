export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface WeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: WeatherCondition[];
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  rain?: {
    "1h"?: number;
    "3h"?: number;
  };
  snow?: {
    "1h"?: number;
    "3h"?: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    sea_level: number;
    grnd_level: number;
    humidity: number;
    temp_kf: number;
  };
  weather: WeatherCondition[];
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust: number;
  };
  visibility: number;
  pop: number; // Probability of precipitation
  sys: {
    pod: string;
  };
  dt_txt: string;
}

export interface ForecastData {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastItem[];
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

export interface AirQualityData {
  list: {
    main: {
      aqi: number; // 1 = Good, 5 = Very Poor
    };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
    dt: number;
  }[];
}

export type ThemeMode = 'clear-day' | 'clear-night' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'drizzle';

export interface AppState {
  weather: WeatherData | null;
  forecast: ForecastData | null;
  airQuality: AirQualityData | null;
  loading: boolean;
  error: string | null;
  unit: 'metric' | 'imperial';
}

export interface DailyForecastSummary {
  date: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue
  minTemp: number;
  maxTemp: number;
  pop: number; // Max probability of precipitation
  weather: WeatherCondition;
}
// ---------------------------------------------------------------------------
// Additions for BrightSide v4
// ---------------------------------------------------------------------------

/** OpenWeather Geocoding API (/geo/1.0/direct and /geo/1.0/reverse) result */
export interface GeoResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

/**
 * Optional keyless enrichment from Open-Meteo, used only for data the
 * OpenWeather free tier does not provide (UV index, days 6-10, 15-min nowcast).
 * Times are unix seconds.
 */
export interface ExtrasData {
  utc_offset_seconds: number;
  current?: { time: number; uv_index: number | null };
  hourly?: { time: number[]; uv_index: (number | null)[] };
  daily?: {
    time: number[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    uv_index_max: (number | null)[];
    precipitation_sum: (number | null)[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: (number | null)[];
    wind_gusts_10m_max: (number | null)[];
    wind_direction_10m_dominant: (number | null)[];
    sunrise: number[];
    sunset: number[];
  };
  minutely_15?: { time: number[]; precipitation: (number | null)[] };
}
