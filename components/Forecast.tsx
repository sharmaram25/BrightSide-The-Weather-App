import React, { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { Forecast as FC, Settings } from '../lib/model';
import { upcoming } from '../lib/insights';
import { sunTimes } from '../lib/astro';
import { Card, Segmented } from './ui';
import HourlyStrip, { buildStrip, StripMetric } from './HourlyStrip';

interface ForecastProps {
  data: FC;
  settings: Settings;
}

/** Hourly forecast card (OpenWeather 3-hour steps over the next 48h). */
const Forecast: React.FC<ForecastProps> = ({ data, settings }) => {
  const [metric, setMetric] = useState<StripMetric>('temp');
  const hasUv = data.hourly.some((h) => h.uv != null);

  const items = useMemo(() => {
    const hours = upcoming(data, 48).filter((h) => h.time > Date.now() / 1000);
    const evs: { t: number; type: 'sunrise' | 'sunset' }[] = [];
    for (let d = 0; d < 3; d++) {
      const st = sunTimes(Date.now() + d * 86400000, data.lat, data.lon);
      evs.push({ t: st.sunrise, type: 'sunrise' }, { t: st.sunset, type: 'sunset' });
    }
    return buildStrip(hours, { current: data.current, sunEvents: evs });
  }, [data]);

  const options: { value: StripMetric; label: string }[] = [
    { value: 'temp', label: 'Temp' },
    { value: 'rain', label: 'Rain' },
    { value: 'wind', label: 'Wind' },
    ...(hasUv ? [{ value: 'uv' as StripMetric, label: 'UV' }] : []),
  ];

  return (
    <Card title="Hourly forecast" icon={<Clock size={13} />} right="3-hour steps">
      <div className="mb-3">
        <Segmented<StripMetric> value={metric} onChange={setMetric} options={options} layoutId={`hourly-metric`} size="sm" />
      </div>
      <HourlyStrip items={items} metric={metric} offset={data.offset} settings={settings} gid="main" />
    </Card>
  );
};

export default React.memo(Forecast);
