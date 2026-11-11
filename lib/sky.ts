import { Forecast, IconKind } from './model';
import { moonInfo, sunTimes } from './astro';
import { SkyScene } from './skyEngine';

export type Phase = 'night' | 'dawn' | 'day' | 'golden' | 'dusk';
type Palette = [string, string, string];

const CLEAR: Record<Phase, Palette> = {
  night: ['#050916', '#0c1631', '#1c2b4d'],
  dawn: ['#1f2b5c', '#6d5aa3', '#ee9f7c'],
  day: ['#1a52ad', '#3b82d0', '#7fb6e6'],
  golden: ['#28539a', '#c97c63', '#f2b56f'],
  dusk: ['#121a3e', '#4f3675', '#d4735c'],
};

const WEATHER: Partial<Record<IconKind, { day: Palette; night: Palette; w: number }>> = {
  partly: { day: ['#2a5a9e', '#5288c2', '#8fb4d9'], night: ['#0a1124', '#17223d', '#283656'], w: 0.25 },
  cloudy: { day: ['#41567a', '#687f9f', '#9aabc2'], night: ['#0e1420', '#1c2434', '#2c3548'], w: 0.6 },
  overcast: { day: ['#3c4a5f', '#5d6b80', '#8590a1'], night: ['#0c1018', '#191f2b', '#272e3c'], w: 0.85 },
  fog: { day: ['#55606f', '#7a8492', '#a0a8b2'], night: ['#12161d', '#212731', '#353c47'], w: 0.85 },
  haze: { day: ['#5b6474', '#8a8a8a', '#b8a88f'], night: ['#13161d', '#24262d', '#3a3833'], w: 0.7 },
  drizzle: { day: ['#2f4058', '#4e6079', '#74859b'], night: ['#0a0f19', '#161e2c', '#232d3e'], w: 0.85 },
  rain: { day: ['#26364c', '#43546c', '#66778e'], night: ['#070c16', '#121a28', '#1f2939'], w: 0.9 },
  'heavy-rain': { day: ['#1c2939', '#334256', '#506177'], night: ['#05080f', '#0e141f', '#1a2230'], w: 0.95 },
  thunder: { day: ['#151b2b', '#2a2f48', '#4a4766'], night: ['#05060d', '#11131f', '#25233a'], w: 0.95 },
  snow: { day: ['#55698a', '#7e91ad', '#aab8cc'], night: ['#141b2b', '#252f44', '#3e4a63'], w: 0.85 },
  sleet: { day: ['#3e4f68', '#62748e', '#8e9db2'], night: ['#0f1522', '#1d2537', '#323d52'], w: 0.88 },
  wind: { day: ['#2f5a8f', '#5a83b3', '#91afd0'], night: ['#0a1124', '#18233e', '#2a3858'], w: 0.3 },
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
};

export const skyPhase = (now: number, sunrise: number, sunset: number): Phase => {
  if (now >= sunrise - 2700 && now < sunrise + 1800) return 'dawn';
  if (now >= sunset - 4500 && now < sunset - 600) return 'golden';
  if (now >= sunset - 600 && now < sunset + 2700) return 'dusk';
  if (now >= sunrise && now < sunset) return 'day';
  return 'night';
};

export const skyPalette = (phase: Phase, kind: IconKind): Palette => {
  const base = CLEAR[phase];
  const wx = WEATHER[kind];
  if (!wx) return base;
  const target = phase === 'night' || phase === 'dusk' ? wx.night : wx.day;
  const weight = phase === 'dawn' || phase === 'golden' || phase === 'dusk' ? wx.w * 0.7 : wx.w;
  return base.map((c, i) => mix(c, target[i], weight)) as Palette;
};

export const sceneFor = (fc: Forecast, lite: boolean, reduced: boolean) => {
  const c = fc.current;
  const now = Date.now() / 1000;
  // Computed live so the sky stays right even when showing cached data
  const st = sunTimes(Date.now(), fc.lat, fc.lon);
  const polar = !Number.isFinite(st.sunrise) || !Number.isFinite(st.sunset);
  const sunrise = polar ? c.sunrise : st.sunrise;
  const sunset = polar ? c.sunset : st.sunset;
  const isDay = now >= sunrise && now < sunset;
  const phase = skyPhase(now, sunrise, sunset);
  const kind = c.condition.kind;
  const precipIntensity = Math.min(1, (c.precip1h || (kind === 'heavy-rain' ? 8 : kind === 'rain' ? 3 : 1)) / 8);
  const scene: SkyScene = {
    kind,
    isDay,
    cloud: Math.min(1, c.clouds / 100),
    precip: precipIntensity,
    wind: c.windSpeed * Math.sin(((c.windDeg + 180) * Math.PI) / 180),
    moonPhase: moonInfo(Date.now()).phase,
    southern: fc.lat < 0,
    sunProgress: isDay ? (now - sunrise) / (sunset - sunrise) : null,
    lite,
    reduced,
  };
  return { scene, palette: skyPalette(phase, kind), phase };
};
