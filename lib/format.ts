import { Settings } from './model';

// ---------- units ----------

export const toTemp = (c: number, s: Settings) => (s.temp === 'f' ? c * 1.8 + 32 : c);
export const fmtTemp = (c: number, s: Settings) => `${Math.round(toTemp(c, s))}°`;
/** temperature difference (no offset) */
export const toTempDelta = (dc: number, s: Settings) => (s.temp === 'f' ? dc * 1.8 : dc);

export const windUnitLabel = (s: Settings) => ({ kmh: 'km/h', mph: 'mph', ms: 'm/s', kn: 'kn' })[s.wind];
export const toWind = (ms: number, s: Settings) => {
  switch (s.wind) {
    case 'kmh':
      return ms * 3.6;
    case 'mph':
      return ms * 2.23694;
    case 'kn':
      return ms * 1.94384;
    default:
      return ms;
  }
};
export const fmtWind = (ms: number, s: Settings) => {
  const v = toWind(ms, s);
  return `${s.wind === 'ms' ? v.toFixed(1) : Math.round(v)} ${windUnitLabel(s)}`;
};

export const pressureUnitLabel = (s: Settings) => ({ hpa: 'hPa', inhg: 'inHg', mmhg: 'mmHg' })[s.pressure];
export const fmtPressureValue = (hpa: number, s: Settings) => {
  if (s.pressure === 'inhg') return (hpa * 0.02953).toFixed(2);
  if (s.pressure === 'mmhg') return Math.round(hpa * 0.750062).toString();
  return Math.round(hpa).toString();
};

export const fmtPrecip = (mm: number, s: Settings) => {
  if (s.precip === 'in') {
    const v = mm / 25.4;
    return `${v < 0.1 && v > 0 ? v.toFixed(2) : v.toFixed(1)} in`;
  }
  return `${mm < 10 && mm > 0 ? mm.toFixed(1) : Math.round(mm)} mm`;
};

export const fmtDistance = (m: number, s: Settings) => {
  if (s.distance === 'mi') {
    const mi = m / 1609.34;
    return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
  }
  const km = m / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
};

export const compass = (deg: number) =>
  ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][
    Math.round((((deg % 360) + 360) % 360) / 22.5) % 16
  ];

export const beaufort = (ms: number) => {
  const scale: [number, string][] = [
    [0.5, 'Calm'],
    [1.6, 'Light air'],
    [3.4, 'Light breeze'],
    [5.5, 'Gentle breeze'],
    [8, 'Moderate breeze'],
    [10.8, 'Fresh breeze'],
    [13.9, 'Strong breeze'],
    [17.2, 'Near gale'],
    [20.8, 'Gale'],
    [24.5, 'Strong gale'],
    [28.5, 'Storm'],
    [32.7, 'Violent storm'],
  ];
  for (let i = 0; i < scale.length; i++) if (ms < scale[i][0]) return { force: i, label: scale[i][1] };
  return { force: 12, label: 'Hurricane force' };
};

// ---------- time (location-local, via fixed UTC offset) ----------

const fmtCache = new Map<string, Intl.DateTimeFormat>();
const formatter = (opts: Intl.DateTimeFormatOptions) => {
  const key = JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(undefined, { ...opts, timeZone: 'UTC' });
    fmtCache.set(key, f);
  }
  return f;
};

const hour12 = (s: Settings) => (s.time === 'auto' ? undefined : s.time === '12');
const shift = (t: number, offset: number) => new Date((t + offset) * 1000);

export const fmtTime = (t: number, offset: number, s: Settings) =>
  formatter({ hour: 'numeric', minute: '2-digit', hour12: hour12(s) }).format(shift(t, offset));

export const fmtHour = (t: number, offset: number, s: Settings) => {
  const h12 = hour12(s);
  const uses12 = h12 ?? formatter({ hour: 'numeric' }).resolvedOptions().hour12;
  if (uses12) return formatter({ hour: 'numeric', hour12: true }).format(shift(t, offset)).replace(/\s/g, '').toUpperCase();
  return formatter({ hour: '2-digit', hour12: false }).format(shift(t, offset));
};

export const fmtWeekday = (t: number, offset: number, style: 'short' | 'long' = 'short') =>
  formatter({ weekday: style }).format(shift(t, offset));

export const fmtDate = (t: number, offset: number) =>
  formatter({ weekday: 'long', day: 'numeric', month: 'short' }).format(shift(t, offset));

export const localHour = (t: number, offset: number) => shift(t, offset).getUTCHours() + shift(t, offset).getUTCMinutes() / 60;

export const localDayKey = (t: number, offset: number) => shift(t, offset).toISOString().slice(0, 10);

/** unix seconds of local midnight for the day containing t */
export const localMidnight = (t: number, offset: number) => Math.floor((t + offset) / 86400) * 86400 - offset;

export const fmtDuration = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return `${h}h ${m}m`;
};

export const relativeMinutes = (ms: number) => {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

export const flag = (cc?: string) =>
  cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : '';

let regionNames: Intl.DisplayNames | null = null;
export const countryName = (cc: string) => {
  try {
    regionNames ??= new Intl.DisplayNames(undefined, { type: 'region' });
    return regionNames.of(cc.toUpperCase()) ?? cc;
  } catch {
    return cc;
  }
};

// ---------- colour ----------

const TEMP_STOPS: [number, [number, number, number]][] = [
  [-15, [129, 140, 248]],
  [-5, [96, 165, 250]],
  [3, [56, 189, 248]],
  [10, [45, 212, 191]],
  [16, [163, 230, 53]],
  [22, [250, 204, 21]],
  [28, [251, 146, 60]],
  [34, [244, 63, 94]],
  [42, [190, 18, 60]],
];

export const tempColor = (c: number, alpha = 1) => {
  let lo = TEMP_STOPS[0];
  let hi = TEMP_STOPS[TEMP_STOPS.length - 1];
  if (c <= lo[0]) hi = lo;
  else if (c >= hi[0]) lo = hi;
  else
    for (let i = 0; i < TEMP_STOPS.length - 1; i++) {
      if (c >= TEMP_STOPS[i][0] && c <= TEMP_STOPS[i + 1][0]) {
        lo = TEMP_STOPS[i];
        hi = TEMP_STOPS[i + 1];
        break;
      }
    }
  const t = hi[0] === lo[0] ? 0 : (c - lo[0]) / (hi[0] - lo[0]);
  const ch = (i: number) => Math.round(lo[1][i] + (hi[1][i] - lo[1][i]) * t);
  return `rgba(${ch(0)},${ch(1)},${ch(2)},${alpha})`;
};

export const uvInfo = (uv: number) => {
  if (uv < 3) return { label: 'Low', color: '#4ade80' };
  if (uv < 6) return { label: 'Moderate', color: '#facc15' };
  if (uv < 8) return { label: 'High', color: '#fb923c' };
  if (uv < 11) return { label: 'Very High', color: '#f43f5e' };
  return { label: 'Extreme', color: '#c084fc' };
};

export const aqiInfo = (aqi: number) =>
  [
    { label: 'Unknown', color: '#94a3b8', advice: 'Air quality data unavailable.' },
    { label: 'Good', color: '#4ade80', advice: 'Air is clean. A great day to be outside.' },
    { label: 'Fair', color: '#a3e635', advice: 'Acceptable for most. Unusually sensitive people may notice.' },
    { label: 'Moderate', color: '#facc15', advice: 'Sensitive groups should ease off long outdoor exertion.' },
    { label: 'Poor', color: '#fb923c', advice: 'Limit prolonged outdoor activity. Consider a mask.' },
    { label: 'Very Poor', color: '#f43f5e', advice: 'Health alert. Stay indoors and keep windows closed.' },
  ][Math.max(0, Math.min(5, Math.round(aqi)))];

/** Hour for use inside sentences, e.g. "5 PM" / "17:00" */
export const fmtHourText = (t: number, offset: number, s: Settings) => {
  const h = fmtHour(t, offset, s);
  return /AM|PM/.test(h) ? h.replace(/(\d)(AM|PM)/, '$1 $2') : `${h}:00`;
};
