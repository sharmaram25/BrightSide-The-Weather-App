// Compact solar & lunar calculations (after Vladimir Agafonkin's SunCalc, BSD-2).

const PI = Math.PI;
const rad = PI / 180;
const dayMs = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const e = rad * 23.4397;
const J0 = 0.0009;

const toJulian = (ms: number) => ms / dayMs - 0.5 + J1970;
const fromJulian = (j: number) => (j + 0.5 - J1970) * dayMs;
const toDays = (ms: number) => toJulian(ms) - J2000;

const rightAscension = (l: number, b: number) => Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
const declination = (l: number, b: number) => Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
const altitude = (H: number, phi: number, dec: number) =>
  Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
const siderealTime = (d: number, lw: number) => rad * (280.16 + 360.9856235 * d) - lw;
const solarMeanAnomaly = (d: number) => rad * (357.5291 + 0.98560028 * d);
const eclipticLongitude = (M: number) =>
  M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + PI;

const sunCoords = (d: number) => {
  const L = eclipticLongitude(solarMeanAnomaly(d));
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
};

/** Sun altitude in degrees */
export const sunAltitude = (ms: number, lat: number, lon: number) => {
  const lw = rad * -lon;
  const phi = rad * lat;
  const d = toDays(ms);
  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  return altitude(H, phi, c.dec) / rad;
};

const julianCycle = (d: number, lw: number) => Math.round(d - J0 - lw / (2 * PI));
const approxTransit = (Ht: number, lw: number, n: number) => J0 + (Ht + lw) / (2 * PI) + n;
const solarTransitJ = (ds: number, M: number, L: number) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
const hourAngle = (h: number, phi: number, d: number) =>
  Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

export interface SunTimes {
  sunrise: number;
  sunset: number;
  goldenMorningEnd: number;
  goldenEveningStart: number;
  dawn: number;
  dusk: number;
  noon: number;
}

/** Sun event times (unix seconds) for the day containing `ms`. NaN when the event does not occur. */
export const sunTimes = (ms: number, lat: number, lon: number): SunTimes => {
  const lw = rad * -lon;
  const phi = rad * lat;
  const d = toDays(ms);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const Jnoon = solarTransitJ(ds, M, L);
  const pair = (angle: number) => {
    const w = hourAngle(angle * rad, phi, dec);
    const Jset = solarTransitJ(approxTransit(w, lw, n), M, L);
    const Jrise = Jnoon - (Jset - Jnoon);
    return [fromJulian(Jrise) / 1000, fromJulian(Jset) / 1000];
  };
  const [sunrise, sunset] = pair(-0.833);
  const [goldenMorningEnd, goldenEveningStart] = pair(6);
  const [dawn, dusk] = pair(-6);
  return { sunrise, sunset, goldenMorningEnd, goldenEveningStart, dawn, dusk, noon: fromJulian(Jnoon) / 1000 };
};

const moonCoords = (d: number) => {
  const L = rad * (218.316 + 13.176396 * d);
  const M = rad * (134.963 + 13.064993 * d);
  const F = rad * (93.272 + 13.22935 * d);
  const l = L + rad * 6.289 * Math.sin(M);
  const b = rad * 5.128 * Math.sin(F);
  const dt = 385001 - 20905 * Math.cos(M);
  return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
};

export interface MoonInfo {
  fraction: number; // illuminated 0..1
  phase: number; // 0 new → 0.25 first quarter → 0.5 full → 0.75 last quarter
  name: string;
  daysToFull: number;
  daysToNew: number;
}

const SYNODIC = 29.530588853;

export const moonInfo = (ms: number): MoonInfo => {
  const d = toDays(ms);
  const s = sunCoords(d);
  const m = moonCoords(d);
  const sdist = 149598000;
  const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
  const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(s.ra - m.ra),
    Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra)
  );
  const fraction = (1 + Math.cos(inc)) / 2;
  const phase = 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / PI;

  let name = 'New Moon';
  if (phase < 0.03 || phase > 0.97) name = 'New Moon';
  else if (phase < 0.22) name = 'Waxing Crescent';
  else if (phase < 0.28) name = 'First Quarter';
  else if (phase < 0.47) name = 'Waxing Gibbous';
  else if (phase < 0.53) name = 'Full Moon';
  else if (phase < 0.72) name = 'Waning Gibbous';
  else if (phase < 0.78) name = 'Last Quarter';
  else name = 'Waning Crescent';

  return {
    fraction,
    phase,
    name,
    daysToFull: ((0.5 - phase + 1) % 1) * SYNODIC,
    daysToNew: ((1 - phase) % 1) * SYNODIC,
  };
};

/** SVG path of the lit part of the moon for a given phase (0..1). */
export const moonPath = (phase: number, cx: number, cy: number, r: number, southern = false) => {
  let p = phase % 1;
  if (southern) p = 1 - p;
  const k = Math.cos(2 * PI * p);
  const rx = Math.max(0.001, Math.abs(k) * r);
  const waxing = p < 0.5;
  const outer = waxing ? 1 : 0;
  const term = waxing ? (k > 0 ? 0 : 1) : k < 0 ? 0 : 1;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outer} ${cx} ${cy + r} A ${rx} ${r} 0 0 ${term} ${cx} ${cy - r} Z`;
};
