import { Condition, IconKind } from './model';

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** OpenWeather condition id → icon kind */
export const owKind = (id: number): IconKind => {
  if (id >= 200 && id < 300) return 'thunder';
  if (id >= 300 && id < 400) return 'drizzle';
  if (id === 511) return 'sleet';
  if (id >= 502 && id <= 504) return 'heavy-rain';
  if (id === 522 || id === 531) return 'heavy-rain';
  if (id >= 500 && id < 600) return 'rain';
  if (id >= 611 && id <= 616) return 'sleet';
  if (id >= 600 && id < 700) return 'snow';
  if (id === 701 || id === 741) return 'fog';
  if (id === 771 || id === 781) return 'wind';
  if (id >= 700 && id < 800) return 'haze';
  if (id === 800) return 'clear';
  if (id === 801 || id === 802) return 'partly';
  if (id === 803) return 'cloudy';
  if (id === 804) return 'overcast';
  return 'cloudy';
};

const owLabel = (id: number, description: string, isDay: boolean) => {
  switch (id) {
    case 800:
      return isDay ? 'Sunny' : 'Clear';
    case 801:
      return isDay ? 'Mostly Sunny' : 'Mostly Clear';
    case 802:
      return 'Partly Cloudy';
    case 803:
      return 'Mostly Cloudy';
    case 804:
      return 'Overcast';
    default:
      return titleCase(description);
  }
};

export const owCondition = (w: { id: number; description: string; icon: string }, isDayHint?: boolean): Condition => {
  const isDay = isDayHint ?? !w.icon.endsWith('n');
  return { code: w.id, kind: owKind(w.id), label: owLabel(w.id, w.description, isDay), isDay };
};

/** WMO weather code (Open-Meteo) → condition, for extended-outlook days */
export const wmoCondition = (code: number, isDay = true): Condition => {
  const map: Record<number, [IconKind, string]> = {
    0: ['clear', isDay ? 'Sunny' : 'Clear'],
    1: ['partly', isDay ? 'Mostly Sunny' : 'Mostly Clear'],
    2: ['partly', 'Partly Cloudy'],
    3: ['overcast', 'Overcast'],
    45: ['fog', 'Fog'],
    48: ['fog', 'Freezing Fog'],
    51: ['drizzle', 'Light Drizzle'],
    53: ['drizzle', 'Drizzle'],
    55: ['drizzle', 'Heavy Drizzle'],
    56: ['sleet', 'Freezing Drizzle'],
    57: ['sleet', 'Freezing Drizzle'],
    61: ['rain', 'Light Rain'],
    63: ['rain', 'Rain'],
    65: ['heavy-rain', 'Heavy Rain'],
    66: ['sleet', 'Freezing Rain'],
    67: ['sleet', 'Freezing Rain'],
    71: ['snow', 'Light Snow'],
    73: ['snow', 'Snow'],
    75: ['snow', 'Heavy Snow'],
    77: ['snow', 'Snow Grains'],
    80: ['rain', 'Showers'],
    81: ['rain', 'Showers'],
    82: ['heavy-rain', 'Heavy Showers'],
    85: ['snow', 'Snow Showers'],
    86: ['snow', 'Snow Showers'],
    95: ['thunder', 'Thunderstorms'],
    96: ['thunder', 'Thunderstorms & Hail'],
    99: ['thunder', 'Thunderstorms & Hail'],
  };
  const [kind, label] = map[code] ?? ['cloudy', 'Cloudy'];
  return { code: 1000 + code, kind, label, isDay };
};

/** Higher = more noteworthy; used to pick a day's representative condition */
export const severity = (k: IconKind): number =>
  ({
    clear: 0,
    partly: 1,
    cloudy: 2,
    overcast: 3,
    haze: 3,
    fog: 4,
    wind: 4,
    drizzle: 5,
    rain: 6,
    sleet: 7,
    snow: 7,
    'heavy-rain': 8,
    thunder: 9,
  })[k];

export const isWet = (k: IconKind) =>
  k === 'drizzle' || k === 'rain' || k === 'heavy-rain' || k === 'sleet' || k === 'snow' || k === 'thunder';
