import { isWet } from './conditions';
import { DayPoint, Forecast, HourPoint, NowcastPoint, Settings } from './model';
import { fmtHourText as fmtHour, fmtTemp, fmtTime, fmtWind, fmtPrecip, localHour, toTempDelta, fmtDistance } from './format';
import { moonInfo, sunTimes } from './astro';

const nowSec = () => Date.now() / 1000;

/** Highest UV for the rest of the daylight hours (falls back to the daily max when hourly UV is missing). */
const remainingUv = (fc: Forecast) => {
  const next = upcoming(fc, 12).filter((h) => h.uv != null && h.condition.isDay && h.time > nowSec() - 3600);
  const vals = [fc.current.condition.isDay ? (fc.current.uv ?? 0) : 0, ...next.map((h) => h.uv ?? 0)];
  const known = fc.current.uv != null || next.length > 0;
  return { uv: known ? Math.max(...vals) : (fc.daily[0]?.uvMax ?? 0), known: known || fc.daily[0]?.uvMax != null };
};

const skyPhrase = (kind: string, label: string, isDay: boolean) => {
  switch (kind) {
    case 'clear':
      return isDay ? 'Sunny' : 'Clear skies';
    case 'partly':
      return 'Partly cloudy';
    case 'cloudy':
      return 'Mostly cloudy';
    case 'overcast':
      return 'Overcast';
    case 'fog':
      return 'Foggy';
    case 'haze':
      return label === 'Haze' ? 'Hazy' : `Hazy with ${label.toLowerCase()}`;
    case 'wind':
      return 'Blustery';
    default:
      return label;
  }
};

export const upcoming = (fc: Forecast, hours = 24) => {
  const t = nowSec();
  return fc.hourly.filter((h) => h.time > t - 5400 && h.time <= t + hours * 3600);
};

const partOfDay = (h: number) => (h < 5 ? 'overnight' : h < 12 ? 'in the morning' : h < 17 ? 'in the afternoon' : h < 21 ? 'in the evening' : 'tonight');

// ---------------------------------------------------------------- nowcast

export interface NowcastSummary {
  wetNow: boolean;
  title: string;
  points: NowcastPoint[];
}

const WET = 0.05; // mm / 15 min

export const nowcastSummary = (points: NowcastPoint[] | null): NowcastSummary | null => {
  if (!points || points.length < 2) return null;
  if (!points.some((p) => p.precip >= WET)) return null;
  const t = nowSec();
  const mins = (p: NowcastPoint) => Math.max(5, Math.round((p.time - t) / 60 / 5) * 5);
  const wetNow = points[0].precip >= WET || points[1].precip >= WET;
  if (wetNow) {
    const stop = points.findIndex((p, i) => i > 0 && points.slice(i).every((q) => q.precip < WET));
    return { wetNow, points, title: stop > 0 ? `Rain easing in about ${mins(points[stop])} min` : 'Rain continuing for the next two hours' };
  }
  const start = points.find((p) => p.precip >= WET)!;
  return { wetNow, points, title: `Rain starting in about ${mins(start)} min` };
};

// ---------------------------------------------------------------- headline

export const headline = (fc: Forecast, s: Settings): string => {
  const c = fc.current;
  const next = upcoming(fc, 24);
  const nc = nowcastSummary(fc.nowcast);
  if (nc) return nc.title + '.';

  const off = fc.offset;
  const firstWet = next.find((h) => isWet(h.condition.kind) && h.pop >= 0.45);
  if (isWet(c.condition.kind)) {
    const dry = next.find((h) => h.time > nowSec() && (!isWet(h.condition.kind) || h.pop < 0.3));
    const lbl = c.condition.label.charAt(0) + c.condition.label.slice(1).toLowerCase();
    return dry ? `${lbl} now, clearing around ${fmtHour(dry.time, off, s)}.` : `${lbl} continuing through the day.`;
  }
  if (firstWet) {
    const storm = firstWet.condition.kind === 'thunder';
    return `${storm ? 'Thunderstorms' : firstWet.condition.kind === 'snow' ? 'Snow' : 'Rain'} likely around ${fmtHour(firstWet.time, off, s)} (${Math.round(firstWet.pop * 100)}% chance).`;
  }

  const today = fc.daily[0];
  const tomorrow = fc.daily[1];
  const hourNow = localHour(nowSec(), off);
  if (hourNow >= 17 && tomorrow) {
    const diff = Math.round(toTempDelta(tomorrow.tMax - today.tMax, s));
    const cmp = Math.abs(diff) >= 2 ? `${Math.abs(diff)}° ${diff > 0 ? 'warmer' : 'cooler'} tomorrow` : 'Similar temperatures tomorrow';
    return `${cmp}, ${tomorrow.condition.label.toLowerCase()} with a high of ${fmtTemp(tomorrow.tMax, s)}.`;
  }
  const kinds = new Set(next.slice(0, 4).map((h) => h.condition.kind));
  const steady = kinds.size === 1 || next.length < 3;
  const sky = skyPhrase(c.condition.kind, c.condition.label, c.condition.isDay);
  const later = next[2] ? skyPhrase(next[2].condition.kind, next[2].condition.label, next[2].condition.isDay).toLowerCase() : '';
  return `${steady || !later || later === sky.toLowerCase() ? `${sky} for the rest of the day` : `${sky} now, ${later} later`}. High of ${fmtTemp(today.tMax, s)}.`;
};

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------- alerts

export type AlertKind = 'heat' | 'uv' | 'wind' | 'rain' | 'storm' | 'cold' | 'fog' | 'air';
export interface WxAlert {
  id: AlertKind;
  level: 'severe' | 'warn' | 'info';
  title: string;
  detail: string;
}

export const alerts = (fc: Forecast, s: Settings): WxAlert[] => {
  const out: WxAlert[] = [];
  const off = fc.offset;
  const next = upcoming(fc, 24);
  const c = fc.current;
  const max = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((a, b) => (f(b) > f(a) ? b : a), arr[0]);

  const storm = next.find((h) => h.condition.kind === 'thunder');
  if (storm || c.condition.kind === 'thunder')
    out.push({
      id: 'storm',
      level: 'warn',
      title: 'Thunderstorms expected',
      detail: storm && c.condition.kind !== 'thunder' ? `From around ${fmtHour(storm.time, off, s)}. Head indoors when thunder roars.` : 'Active now. Stay indoors and away from open ground.',
    });

  const rainSum = next.reduce((sum, h) => sum + h.precip, 0);
  if (rainSum >= 20)
    out.push({
      id: 'rain',
      level: rainSum >= 50 ? 'severe' : 'warn',
      title: rainSum >= 50 ? 'Very heavy rain' : 'Heavy rain',
      detail: `${fmtPrecip(rainSum, s)} expected over 24 hours. Watch for waterlogging.`,
    });

  const hottest = max([...next, { feelsLike: c.feelsLike, time: c.time } as HourPoint], (h) => h.feelsLike);
  if (hottest && hottest.feelsLike >= 35)
    out.push({
      id: 'heat',
      level: hottest.feelsLike >= 41 ? 'severe' : 'warn',
      title: hottest.feelsLike >= 41 ? 'Extreme heat' : 'High heat',
      detail: `Feels like ${fmtTemp(hottest.feelsLike, s)}${hottest.time > nowSec() ? ` around ${fmtHour(hottest.time, off, s)}` : ' now'}. Hydrate and limit midday sun.`,
    });

  const coldest = next.length ? next.reduce((a, b) => (b.temp < a.temp ? b : a)) : null;
  if (coldest && coldest.temp <= 0)
    out.push({ id: 'cold', level: coldest.temp <= -10 ? 'severe' : 'warn', title: 'Freezing temperatures', detail: `Down to ${fmtTemp(coldest.temp, s)} around ${fmtHour(coldest.time, off, s)}. Watch for ice.` });

  const gust = Math.max(c.windGust ?? c.windSpeed, ...next.map((h) => h.windGust ?? h.windSpeed));
  if (gust >= 17)
    out.push({ id: 'wind', level: gust >= 24 ? 'severe' : 'warn', title: gust >= 24 ? 'Damaging winds' : 'Strong winds', detail: `Gusts up to ${fmtWind(gust, s)}. Secure loose objects.` });

  const uvMax = remainingUv(fc).uv;
  if (uvMax >= 8)
    out.push({ id: 'uv', level: uvMax >= 11 ? 'severe' : 'warn', title: uvMax >= 11 ? 'Extreme UV' : 'Very high UV', detail: `Index peaks at ${Math.round(uvMax)}. Cover up and seek shade 11 AM – 3 PM.` });

  if (c.visibility < 1000)
    out.push({ id: 'fog', level: 'info', title: 'Low visibility', detail: `Only ${fmtDistance(c.visibility, s)} right now. Drive slowly with low beams.` });

  if (fc.air && fc.air.aqi >= 4)
    out.push({ id: 'air', level: fc.air.aqi >= 5 ? 'severe' : 'warn', title: 'Unhealthy air', detail: 'Limit time outdoors and consider wearing a mask.' });

  const rank = { severe: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
};

// ---------------------------------------------------------------- essentials

export type EssentialId = 'umbrella' | 'jacket' | 'sunscreen' | 'water' | 'mask' | 'sunglasses';
export interface Essential {
  id: EssentialId;
  label: string;
  active: boolean;
  note: string;
}

export const essentials = (fc: Forecast): Essential[] => {
  const next = upcoming(fc, 12);
  const c = fc.current;
  const pop = Math.max(0, ...next.map((h) => (isWet(h.condition.kind) ? h.pop : h.pop * 0.6)));
  const wetNow = isWet(c.condition.kind);
  const minFeels = Math.min(c.feelsLike, ...next.map((h) => h.feelsLike));
  const maxFeels = Math.max(c.feelsLike, ...next.map((h) => h.feelsLike));
  const { uv, known: uvKnown } = remainingUv(fc);
  const sunny = ['clear', 'partly'].includes(c.condition.kind) && c.condition.isDay;
  const needSunscreen = uvKnown ? uv >= 4 : sunny && c.temp > 22;

  return [
    { id: 'umbrella', label: 'Umbrella', active: wetNow || pop >= 0.4, note: wetNow ? 'Wet now' : pop >= 0.4 ? `${Math.round(pop * 100)}% chance` : 'Not needed' },
    { id: 'jacket', label: 'Jacket', active: minFeels < 14, note: minFeels < 5 ? 'Bundle up' : minFeels < 14 ? 'Layer up' : 'Not needed' },
    { id: 'sunscreen', label: 'Sunscreen', active: needSunscreen, note: needSunscreen ? (uvKnown ? `UV ${Math.round(uv)}` : 'Strong sun') : 'Optional' },
    { id: 'sunglasses', label: 'Shades', active: sunny && (!uvKnown || uv >= 3), note: sunny ? 'Bright out' : 'Not needed' },
    { id: 'water', label: 'Water', active: maxFeels >= 30, note: maxFeels >= 30 ? 'Stay hydrated' : 'As usual' },
    { id: 'mask', label: 'Mask', active: (fc.air?.aqi ?? 0) >= 4, note: (fc.air?.aqi ?? 0) >= 4 ? 'Poor air' : 'Air is OK' },
  ];
};

// ---------------------------------------------------------------- activities

export interface ActivityScore {
  id: 'run' | 'cycle' | 'outdoor' | 'laundry' | 'stars' | 'photo';
  name: string;
  score: number;
  label: string;
  note: string;
}

const clamp = (v: number, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, v));
const band = (v: number, lo: number, hi: number, slope: number) => (v < lo ? (lo - v) * slope : v > hi ? (v - hi) * slope : 0);
const labelFor = (score: number) => (score >= 8 ? 'Great' : score >= 6 ? 'Good' : score >= 4 ? 'Fair' : 'Poor');

export const activities = (fc: Forecast, s: Settings): ActivityScore[] => {
  const off = fc.offset;
  const next = upcoming(fc, 24);
  const aqi = fc.air?.aqi ?? 1;
  const daylight = next.filter((h) => {
    const lh = localHour(h.time, off);
    return lh >= 5 && lh <= 21;
  });
  const pick = (hours: HourPoint[], fn: (h: HourPoint) => number) => {
    if (!hours.length) return { score: 0, h: null as HourPoint | null };
    let best = hours[0];
    let bestScore = -1;
    for (const h of hours) {
      const sc = fn(h);
      if (sc > bestScore) {
        bestScore = sc;
        best = h;
      }
    }
    return { score: clamp(bestScore), h: best };
  };
  const when = (h: HourPoint | null) => (h ? (h.time - nowSec() < 5400 ? 'now' : `around ${fmtHour(h.time, off, s)}`) : '');
  const out: ActivityScore[] = [];

  const run = pick(daylight, (h) => 10 - band(h.feelsLike, 7, 19, 0.45) - h.pop * 7 - Math.max(0, h.windSpeed - 8) * 0.7 - Math.max(0, aqi - 2) * 1.6 - Math.max(0, (h.uv ?? 0) - 7) * 0.6);
  out.push({ id: 'run', name: 'Running', score: run.score, label: labelFor(run.score), note: run.score >= 4 ? `Best ${when(run.h)}` : 'Better indoors today' });

  const cyc = pick(daylight, (h) => 10 - band(h.feelsLike, 12, 25, 0.4) - h.pop * 8 - Math.max(0, h.windSpeed - 5) * 0.9 - Math.max(0, aqi - 2) * 1.4);
  out.push({ id: 'cycle', name: 'Cycling', score: cyc.score, label: labelFor(cyc.score), note: cyc.score >= 4 ? `Best ${when(cyc.h)}` : 'Rough riding conditions' });

  const outd = pick(daylight.filter((h) => h.condition.isDay), (h) => 10 - band(h.feelsLike, 20, 30, 0.45) - h.pop * 8 - Math.max(0, h.windSpeed - 7) * 0.6 - Math.max(0, (h.uv ?? 0) - 8) * 0.8 - Math.max(0, aqi - 3) * 1.5);
  out.push({ id: 'outdoor', name: 'Outdoors', score: outd.score, label: labelFor(outd.score), note: outd.h ? (outd.score >= 4 ? `Best ${when(outd.h)}` : 'Plan something indoors') : 'After sunrise' });

  const dayHours = next.filter((h) => {
    const lh = localHour(h.time, off);
    return lh >= 8 && lh <= 17;
  });
  const laundryScore = dayHours.length
    ? clamp(10 - Math.max(...dayHours.map((h) => h.pop)) * 10 - Math.max(0, dayHours.reduce((a, h) => a + h.humidity, 0) / dayHours.length - 50) / 7 + Math.min(1.5, dayHours.reduce((a, h) => a + h.windSpeed, 0) / dayHours.length / 3) - dayHours.reduce((a, h) => a + h.clouds, 0) / dayHours.length / 50)
    : 0;
  out.push({ id: 'laundry', name: 'Air drying', score: laundryScore, label: labelFor(laundryScore), note: laundryScore >= 6 ? 'Hang it out' : laundryScore >= 4 ? 'Slow to dry' : 'Use the dryer' });

  const night = next.filter((h) => {
    const lh = localHour(h.time, off);
    return lh >= 20 || lh <= 3;
  });
  const moon = moonInfo(Date.now());
  const avgCloud = night.length ? night.reduce((a, h) => a + h.clouds, 0) / night.length : 100;
  const starScore = night.length ? clamp(10 * (1 - avgCloud / 100) - moon.fraction * 2.5 - Math.max(...night.map((h) => h.pop)) * 5 - (fc.air && fc.air.aqi >= 4 ? 1.5 : 0)) : 0;
  const clearest = night.length ? night.reduce((a, b) => (b.clouds < a.clouds ? b : a)) : null;
  out.push({
    id: 'stars',
    name: 'Stargazing',
    score: starScore,
    label: labelFor(starScore),
    note: starScore >= 6 ? `Best ${when(clearest)}` : moon.fraction > 0.8 && avgCloud < 40 ? 'Bright moon tonight' : 'Clouds in the way',
  });

  const st = sunTimes(Date.now(), fc.lat, fc.lon);
  const evening = fc.hourly.find((h) => Math.abs(h.time - st.sunset) <= 5400) ?? next[0];
  const cl = evening?.clouds ?? 50;
  const photoScore = evening ? clamp((cl >= 20 && cl <= 65 ? 9.5 : cl < 20 ? 7 : cl < 85 ? 5 : 2.5) - evening.pop * 6) : 0;
  const goldenStart = st.goldenEveningStart > nowSec() ? st.goldenEveningStart : sunTimes(Date.now() + 86400000, fc.lat, fc.lon).goldenEveningStart;
  out.push({
    id: 'photo',
    name: 'Golden hour',
    score: photoScore,
    label: photoScore >= 8 ? 'Vivid' : labelFor(photoScore),
    note: Number.isFinite(goldenStart) ? `Starts ${fmtTime(goldenStart, off, s)}` : 'No golden hour',
  });

  return out;
};

// ---------------------------------------------------------------- day summary

export const daySummary = (day: DayPoint, offset: number, s: Settings): string => {
  const parts: string[] = [];
  const wet = day.hours.filter((h) => isWet(h.condition.kind) && h.pop >= 0.35);
  if (wet.length) {
    const peak = wet.reduce((a, b) => (b.pop > a.pop ? b : a));
    const kind = peak.condition.kind === 'thunder' ? 'Thunderstorms' : peak.condition.kind === 'snow' ? 'Snow' : 'Rain';
    parts.push(`${kind} likely ${partOfDay(localHour(peak.time, offset))} (${Math.round(peak.pop * 100)}%).`);
  } else if (day.pop >= 0.35) {
    parts.push(`${Math.round(day.pop * 100)}% chance of rain.`);
  } else {
    parts.push(`${day.condition.label} with a high of ${fmtTemp(day.tMax, s)}.`);
  }
  if ((day.gustMax ?? 0) >= 11) parts.push(`Breezy, gusts up to ${fmtWind(day.gustMax!, s)}.`);
  if ((day.uvMax ?? 0) >= 8) parts.push('Very high UV around midday.');
  if (day.tMin <= 0) parts.push(`Frost possible with a low of ${fmtTemp(day.tMin, s)}.`);
  return parts.join(' ');
};
