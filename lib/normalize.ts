import { AirQualityData, ExtrasData, ForecastData, WeatherData } from '../types';
import { owCondition, severity, isWet, wmoCondition } from './conditions';
import { AirQuality, Current, DayPoint, Forecast, HourPoint, NowcastPoint } from './model';
import { localDayKey, localHour, localMidnight } from './format';
import { sunTimes } from './astro';

/** Magnus-formula dew point (°C) */
export const dewPoint = (t: number, rh: number) => {
  const a = 17.625;
  const b = 243.04;
  const g = Math.log(Math.max(rh, 1) / 100) + (a * t) / (b + t);
  return (b * g) / (a - g);
};

const nearest = (times: number[] | undefined, t: number, tolerance = 1800) => {
  if (!times) return -1;
  let best = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(times[i] - t);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return bestDiff <= tolerance ? best : -1;
};

export const normalize = (
  w: WeatherData,
  f: ForecastData,
  air: AirQualityData | null,
  airForecast: AirQualityData | null,
  extras: ExtrasData | null
): Forecast => {
  const offset = w.timezone;
  const ex = extras ?? undefined;

  const current: Current = {
    time: w.dt,
    temp: w.main.temp,
    feelsLike: w.main.feels_like,
    humidity: w.main.humidity,
    dewPoint: dewPoint(w.main.temp, w.main.humidity),
    pressure: w.main.sea_level ?? w.main.pressure,
    visibility: w.visibility ?? 10000,
    windSpeed: w.wind.speed,
    windDeg: w.wind.deg,
    windGust: w.wind.gust ?? null,
    clouds: w.clouds.all,
    precip1h: w.rain?.['1h'] ?? w.snow?.['1h'] ?? 0,
    uv: ex?.current?.uv_index ?? null,
    condition: owCondition(w.weather[0]),
    sunrise: w.sys.sunrise,
    sunset: w.sys.sunset,
  };
  // Prefer a nighttime icon if the sun is actually down
  const now = w.dt;
  current.condition.isDay = now >= w.sys.sunrise && now < w.sys.sunset;
  if (current.condition.code === 800 || current.condition.code === 801)
    current.condition = owCondition(w.weather[0], current.condition.isDay);

  const hourly: HourPoint[] = f.list.map((it) => {
    const uvIdx = nearest(ex?.hourly?.time, it.dt);
    return {
      time: it.dt,
      temp: it.main.temp,
      feelsLike: it.main.feels_like,
      humidity: it.main.humidity,
      pressure: it.main.sea_level ?? it.main.pressure,
      pop: it.pop ?? 0,
      precip: ((it as any).rain?.['3h'] ?? 0) + ((it as any).snow?.['3h'] ?? 0),
      windSpeed: it.wind.speed,
      windDeg: it.wind.deg,
      windGust: it.wind.gust ?? null,
      clouds: it.clouds.all,
      visibility: it.visibility ?? 10000,
      uv: uvIdx >= 0 ? (ex!.hourly!.uv_index[uvIdx] ?? null) : null,
      condition: owCondition(it.weather[0], it.sys.pod === 'd'),
    };
  });

  // ---- daily: group OpenWeather 3h steps by local date ----
  const groups = new Map<string, HourPoint[]>();
  for (const h of hourly) {
    const key = localDayKey(h.time, offset);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(h);
  }
  const todayKey = localDayKey(now, offset);
  const exDaily = ex?.daily;
  const exIndexByKey = new Map<string, number>();
  exDaily?.time.forEach((t, i) => exIndexByKey.set(localDayKey(t + 3600 * 6, ex!.utc_offset_seconds), i));

  const sunFor = (midnight: number) => {
    const st = sunTimes((midnight + 12 * 3600) * 1000, w.coord.lat, w.coord.lon);
    return { sunrise: st.sunrise, sunset: st.sunset };
  };

  const daily: DayPoint[] = [];
  for (const [key, hours] of groups) {
    const isToday = key === todayKey;
    if (!isToday && hours.length < 4) continue; // drop trailing partial day
    const midnight = localMidnight(hours[0].time, offset);
    const temps = hours.map((h) => h.temp);
    if (isToday) temps.push(current.temp);
    const daytime = hours.filter((h) => {
      const lh = localHour(h.time, offset);
      return lh >= 7 && lh <= 19;
    });
    const pool = daytime.length ? daytime : hours;
    const wet = pool.filter((h) => isWet(h.condition.kind) && h.pop >= 0.3);
    let rep = wet.length
      ? wet.reduce((a, b) => (severity(b.condition.kind) > severity(a.condition.kind) ? b : a))
      : pool.reduce((a, b) => (Math.abs(localHour(b.time, offset) - 13) < Math.abs(localHour(a.time, offset) - 13) ? b : a));
    if (isToday && !wet.length && pool === hours && severity(current.condition.kind) >= severity(rep.condition.kind)) {
      rep = { ...rep, condition: current.condition };
    }
    const exI = exIndexByKey.get(key);
    const sun = isToday ? { sunrise: current.sunrise, sunset: current.sunset } : exI !== undefined ? { sunrise: exDaily!.sunrise[exI], sunset: exDaily!.sunset[exI] } : sunFor(midnight);
    const gusts = hours.map((h) => h.windGust ?? 0);
    daily.push({
      time: midnight,
      key,
      tMin: Math.min(...temps),
      tMax: Math.max(...temps),
      condition: { ...rep.condition, isDay: true, label: rep.condition.label.replace(/^Clear$/, 'Sunny').replace(/^Mostly Clear$/, 'Mostly Sunny') },
      pop: Math.max(...hours.map((h) => h.pop)),
      precip: hours.reduce((s, h) => s + h.precip, 0),
      windMax: Math.max(...hours.map((h) => h.windSpeed)),
      gustMax: Math.max(...gusts) || null,
      windDeg: rep.windDeg,
      humidity: Math.round(hours.reduce((s, h) => s + h.humidity, 0) / hours.length),
      uvMax: exI !== undefined ? (exDaily!.uv_index_max[exI] ?? null) : null,
      sunrise: sun.sunrise,
      sunset: sun.sunset,
      hours,
      extended: false,
    });
  }

  // ---- extended outlook (days beyond OpenWeather's range) ----
  if (exDaily) {
    const lastKey = daily[daily.length - 1]?.key ?? todayKey;
    exDaily.time.forEach((t, i) => {
      if (daily.length >= 10) return;
      const key = localDayKey(t + 3600 * 6, ex!.utc_offset_seconds);
      if (key <= lastKey) return;
      daily.push({
        time: localMidnight(t + 3600 * 6, offset),
        key,
        tMin: exDaily.temperature_2m_min[i],
        tMax: exDaily.temperature_2m_max[i],
        condition: wmoCondition(exDaily.weather_code[i]),
        pop: (exDaily.precipitation_probability_max[i] ?? 0) / 100,
        precip: exDaily.precipitation_sum[i] ?? 0,
        windMax: exDaily.wind_speed_10m_max[i],
        gustMax: exDaily.wind_gusts_10m_max[i],
        windDeg: exDaily.wind_direction_10m_dominant[i],
        humidity: null,
        uvMax: exDaily.uv_index_max[i],
        sunrise: exDaily.sunrise[i],
        sunset: exDaily.sunset[i],
        hours: [],
        extended: true,
      });
    });
  }

  // ---- nowcast ----
  let nowcast: NowcastPoint[] | null = null;
  const m15 = ex?.minutely_15;
  if (m15?.time?.length) {
    const nowSec = Date.now() / 1000;
    nowcast = m15.time
      .map((t, i) => ({ time: t, precip: m15.precipitation[i] ?? 0 }))
      .filter((p) => p.time >= nowSec - 900)
      .slice(0, 9);
    if (!nowcast.length) nowcast = null;
  }

  // ---- air quality ----
  let airQ: AirQuality | null = null;
  const a = air?.list?.[0];
  if (a) {
    airQ = {
      aqi: a.main.aqi,
      pm2_5: a.components.pm2_5,
      pm10: a.components.pm10,
      o3: a.components.o3,
      no2: a.components.no2,
      so2: a.components.so2,
      co: a.components.co,
      forecast: (airForecast?.list ?? [])
        .filter((x) => x.dt >= now - 3600)
        .slice(0, 48)
        .map((x) => ({ time: x.dt, aqi: x.main.aqi, pm2_5: x.components.pm2_5 })),
    };
  }

  return {
    lat: w.coord.lat,
    lon: w.coord.lon,
    offset,
    fetchedAt: Date.now(),
    current,
    hourly,
    daily,
    nowcast,
    air: airQ,
    hasExtras: !!extras,
  };
};
