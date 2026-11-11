import React from 'react';
import { Forecast, Settings } from '../lib/model';
import AstroPanel from './AstroPanel';
import AirQualityTile from './tiles/AirQualityTile';
import { CloudsTile, FeelsTile, HumidityTile, MoonTile, PrecipTile, PressureTile, UVTile, VisibilityTile, WindTile } from './tiles/Tiles';

interface DetailsGridProps {
  data: Forecast;
  settings: Settings;
}

/** Bento grid of condition tiles. */
const DetailsGrid: React.FC<DetailsGridProps> = ({ data, settings }) => {
  const hasUv = data.current.uv != null;
  const small = [
    hasUv && UVTile,
    WindTile,
    FeelsTile,
    HumidityTile,
    PrecipTile,
    VisibilityTile,
    PressureTile,
    CloudsTile,
  ].filter(Boolean) as React.FC<{ data: Forecast; settings: Settings; delay?: number }>[];
  const moonWide = small.length % 2 === 0;

  return (
    <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
      {data.air && <AirQualityTile data={data} settings={settings} />}
      {small.slice(0, 2).map((T, i) => (
        <T key={i} data={data} settings={settings} delay={(i % 2) * 0.06} />
      ))}
      <AstroPanel data={data} settings={settings} />
      {small.slice(2).map((T, i) => (
        <T key={i + 2} data={data} settings={settings} delay={(i % 2) * 0.06} />
      ))}
      <MoonTile data={data} settings={settings} wide={moonWide} />
    </div>
  );
};

export default React.memo(DetailsGrid);
