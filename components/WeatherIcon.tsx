import React, { useId } from 'react';
import { IconKind } from '../lib/model';

interface Props {
  kind: IconKind;
  isDay?: boolean;
  size?: number;
  animated?: boolean;
  className?: string;
}

const CLOUD = 'M18 46 H46 A9 9 0 0 0 47 28.1 A13 13 0 0 0 22.3 25.2 A10.5 10.5 0 0 0 18 46 Z';

/** Hand-drawn, gently animated weather glyphs (pure SVG + CSS). */
const WeatherIcon: React.FC<Props> = ({ kind, isDay = true, size = 32, animated = false, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${n}-${uid}`;
  const dark = kind === 'rain' || kind === 'heavy-rain' || kind === 'thunder' || kind === 'overcast' || kind === 'sleet';

  const Sun = ({ x = 32, y = 32, r = 11, rays = true }: { x?: number; y?: number; r?: number; rays?: boolean }) => (
    <g>
      {rays && (
        <g className="wx-spin" style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' as any }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={x + Math.cos(a) * (r + 5)}
                y1={y + Math.sin(a) * (r + 5)}
                x2={x + Math.cos(a) * (r + 9.5)}
                y2={y + Math.sin(a) * (r + 9.5)}
                stroke="#fcd34d"
                strokeWidth={2.6}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}
      <circle cx={x} cy={y} r={r + 3} fill={`url(#${id('glow')})`} />
      <circle className="wx-pulse" cx={x} cy={y} r={r} fill={`url(#${id('sun')})`} />
    </g>
  );

  const Moon = ({ x = 32, y = 30, r = 12 }: { x?: number; y?: number; r?: number }) => (
    <g className="wx-float">
      <mask id={id('crescent')}>
        <rect x="0" y="0" width="64" height="64" fill="white" />
        <circle cx={x + r * 0.55} cy={y - r * 0.45} r={r * 0.95} fill="black" />
      </mask>
      <circle cx={x} cy={y} r={r} fill={`url(#${id('moon')})`} mask={`url(#${id('crescent')})`} />
    </g>
  );

  const Stars = () => (
    <g fill="#e2e8f0">
      <circle className="wx-twinkle" cx="50" cy="14" r="1.4" />
      <circle className="wx-twinkle" cx="44" cy="24" r="1" style={{ animationDelay: '1s' }} />
      <circle className="wx-twinkle" cx="54" cy="30" r="0.9" style={{ animationDelay: '1.8s' }} />
    </g>
  );

  const Cloud = ({ dx = 0, dy = 0, s = 1, tone = 'light', cls = 'wx-drift' }: { dx?: number; dy?: number; s?: number; tone?: 'light' | 'dark' | 'back'; cls?: string }) => (
    <g transform={`translate(${dx} ${dy}) translate(32 36) scale(${s}) translate(-32 -36)`}>
      <path className={cls} d={CLOUD} fill={`url(#${id(tone === 'dark' ? 'cloudDark' : tone === 'back' ? 'cloudBack' : 'cloud')})`} />
    </g>
  );

  const Drops = ({ n = 4, color = '#7dd3fc', fast = false }: { n?: number; color?: string; fast?: boolean }) => {
    const xs = n >= 6 ? [20, 26, 32, 38, 44, 29] : n === 3 ? [24, 32, 40] : [22, 29, 36, 43];
    return (
      <g stroke={color} strokeWidth={2.4} strokeLinecap="round">
        {xs.slice(0, n).map((x, i) => (
          <line
            key={i}
            className="wx-drop"
            x1={x}
            y1={49 + (i % 2) * 2}
            x2={x - 2}
            y2={54 + (i % 2) * 2}
            style={{ animationDelay: `${(i * (fast ? 0.17 : 0.28)) % 1.1}s`, animationDuration: fast ? '0.8s' : undefined }}
          />
        ))}
      </g>
    );
  };

  const Flakes = ({ xs = [22, 32, 42] }: { xs?: number[] }) => (
    <g fill="#f1f5f9">
      {xs.map((x, i) => (
        <g key={i} className="wx-flake" style={{ animationDelay: `${i * 0.8}s` }}>
          <circle cx={x} cy={52 + (i % 2) * 2} r={2} />
        </g>
      ))}
    </g>
  );

  const Bolt = () => <path className="wx-bolt" d="M33 40 L26 52 H31.5 L28.5 61 L39 47 H33.5 L36.5 40 Z" fill="#fde047" stroke="#f59e0b" strokeWidth={0.8} strokeLinejoin="round" />;

  const FogLines = ({ y = 48 }: { y?: number }) => (
    <g stroke="#e2e8f0" strokeWidth={2.6} strokeLinecap="round" opacity={0.85}>
      <line className="wx-fog" x1="14" y1={y} x2="44" y2={y} />
      <line className="wx-fog" x1="22" y1={y + 6} x2="52" y2={y + 6} style={{ animationDelay: '-2.5s' }} />
      <line className="wx-fog" x1="16" y1={y + 12} x2="40" y2={y + 12} style={{ animationDelay: '-1.2s' }} />
    </g>
  );

  const Celestial = ({ small }: { small?: boolean }) =>
    isDay ? (
      small ? <Sun x={23} y={23} r={8.5} /> : <Sun />
    ) : small ? (
      <Moon x={23} y={22} r={9.5} />
    ) : (
      <>
        <Moon />
        <Stars />
      </>
    );

  let body: React.ReactNode;
  switch (kind) {
    case 'clear':
      body = <Celestial />;
      break;
    case 'partly':
      body = (
        <>
          <Celestial small />
          <Cloud dx={4} dy={4} s={0.9} />
        </>
      );
      break;
    case 'cloudy':
      body = (
        <>
          <Cloud dx={-7} dy={-7} s={0.75} tone="back" cls="wx-drift-slow" />
          <Cloud dx={3} dy={2} />
        </>
      );
      break;
    case 'overcast':
      body = (
        <>
          <Cloud dx={-6} dy={-8} s={0.8} tone="back" cls="wx-drift-slow" />
          <Cloud dx={2} dy={1} tone="dark" />
        </>
      );
      break;
    case 'fog':
      body = (
        <>
          <Cloud dy={-8} s={0.9} tone="back" />
          <FogLines y={44} />
        </>
      );
      break;
    case 'haze':
      body = (
        <>
          {isDay ? <Sun y={24} r={9} rays={false} /> : <Moon y={22} r={10} />}
          <FogLines y={40} />
        </>
      );
      break;
    case 'drizzle':
      body = (
        <>
          <Cloud dy={-6} />
          <Drops n={3} color="#bae6fd" />
        </>
      );
      break;
    case 'rain':
      body = (
        <>
          <Cloud dy={-6} tone="dark" />
          <Drops n={4} />
        </>
      );
      break;
    case 'heavy-rain':
      body = (
        <>
          <Cloud dx={-6} dy={-12} s={0.75} tone="back" cls="wx-drift-slow" />
          <Cloud dy={-6} tone="dark" />
          <Drops n={6} color="#60a5fa" fast />
        </>
      );
      break;
    case 'sleet':
      body = (
        <>
          <Cloud dy={-6} tone="dark" />
          <Drops n={3} />
          <Flakes xs={[27, 37]} />
        </>
      );
      break;
    case 'snow':
      body = (
        <>
          <Cloud dy={-6} />
          <Flakes xs={[20, 28, 36, 44]} />
        </>
      );
      break;
    case 'thunder':
      body = (
        <>
          <Cloud dx={-6} dy={-12} s={0.75} tone="back" cls="wx-drift-slow" />
          <Cloud dy={-8} tone="dark" />
          <Bolt />
          <g stroke="#7dd3fc" strokeWidth={2.2} strokeLinecap="round">
            <line className="wx-drop" x1="20" y1="48" x2="18" y2="53" />
            <line className="wx-drop" x1="45" y1="48" x2="43" y2="53" style={{ animationDelay: '0.5s' }} />
          </g>
        </>
      );
      break;
    case 'wind':
      body = (
        <g fill="none" stroke="#e2e8f0" strokeWidth={3} strokeLinecap="round" className="wx-drift">
          <path d="M10 26 H38 a6 6 0 1 0 -6 -6" />
          <path d="M10 36 H48 a6 6 0 1 1 -6 6" />
          <path d="M14 46 H30" />
        </g>
      );
      break;
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`wx ${animated ? 'wx-anim' : ''} ${className}`}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={id('sun')} cx="40%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="45%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id={id('glow')}>
          <stop offset="55%" stopColor="#fbbf24" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('moon')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id={id('cloud')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d6dee9" />
        </linearGradient>
        <linearGradient id={id('cloudBack')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={id('cloudDark')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={dark ? '#cbd5e1' : '#ffffff'} />
          <stop offset="100%" stopColor={dark ? '#7c8ba1' : '#d6dee9'} />
        </linearGradient>
      </defs>
      {body}
    </svg>
  );
};

export default React.memo(WeatherIcon);
