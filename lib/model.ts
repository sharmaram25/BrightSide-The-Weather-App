// Normalised weather model used by the UI. All times are unix seconds,
// temperatures °C, wind m/s, pressure hPa, precipitation mm, visibility m.

export type IconKind =
  | 'clear'
  | 'partly'
  | 'cloudy'
  | 'overcast'
  | 'fog'
  | 'haze'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'sleet'
  | 'snow'
  | 'thunder'
  | 'wind';

export interface Condition {
  code: number;
  kind: IconKind;
  label: string;
  isDay: boolean;
}

export interface Current {
  time: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  dewPoint: number;
  pressure: number;
  visibility: number;
  windSpeed: number;
  windDeg: number;
  windGust: number | null;
  clouds: number;
  precip1h: number;
  uv: number | null;
  condition: Condition;
  sunrise: number;
  sunset: number;
}

export interface HourPoint {
  time: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  pop: number; // 0..1
  precip: number; // mm over the 3h step
  windSpeed: number;
  windDeg: number;
  windGust: number | null;
  clouds: number;
  visibility: number;
  uv: number | null;
  condition: Condition;
}

export interface DayPoint {
  time: number; // local midnight (unix)
  key: string; // YYYY-MM-DD local
  tMin: number;
  tMax: number;
  condition: Condition;
  pop: number;
  precip: number;
  windMax: number | null;
  gustMax: number | null;
  windDeg: number | null;
  humidity: number | null;
  uvMax: number | null;
  sunrise: number;
  sunset: number;
  hours: HourPoint[];
  extended: boolean; // comes from the extended (Open-Meteo) outlook
}

export interface NowcastPoint {
  time: number;
  precip: number; // mm per 15 min
}

export interface AirQuality {
  aqi: number; // OpenWeather 1..5
  pm2_5: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  forecast: { time: number; aqi: number; pm2_5: number }[];
}

export interface Forecast {
  lat: number;
  lon: number;
  offset: number; // seconds from UTC
  fetchedAt: number; // ms
  current: Current;
  hourly: HourPoint[];
  daily: DayPoint[];
  nowcast: NowcastPoint[] | null;
  air: AirQuality | null;
  hasExtras: boolean;
}

export interface Place {
  id: string;
  name: string;
  region?: string;
  country: string;
  lat: number;
  lon: number;
}

export type TempUnit = 'c' | 'f';
export type WindUnit = 'kmh' | 'mph' | 'ms' | 'kn';
export type PressureUnit = 'hpa' | 'inhg' | 'mmhg';
export type PrecipUnit = 'mm' | 'in';
export type DistanceUnit = 'km' | 'mi';

export interface Settings {
  temp: TempUnit;
  wind: WindUnit;
  pressure: PressureUnit;
  precip: PrecipUnit;
  distance: DistanceUnit;
  time: 'auto' | '12' | '24';
  effects: 'full' | 'lite';
  haptics: boolean;
}
