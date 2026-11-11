import React from 'react';
import { Download, Share, Sparkles, Vibrate, Clock, PlusSquare } from 'lucide-react';
import { Settings } from '../lib/model';
import { useSettings } from '../state/settings';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { tap } from '../lib/haptics';
import { Segmented, Sheet } from './ui';
import Logo from './Logo';

interface Props {
  open: boolean;
  onClose: () => void;
}

const Row: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div className="min-w-0">
      <div className="text-[15px] font-medium">{label}</div>
      {hint && <div className="text-[12px] text-white/45">{hint}</div>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string }> = ({ on, onChange, label }) => (
  <button
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={() => {
      tap(6);
      onChange(!on);
    }}
    className={`relative h-[30px] w-[50px] rounded-full transition-colors duration-300 ${on ? 'bg-emerald-400/90' : 'bg-white/15'}`}
  >
    <span className={`absolute left-0 top-[3px] h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${on ? 'translate-x-[23px]' : 'translate-x-[3px]'}`} />
  </button>
);

const Group: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-5">
    <div className="label mb-1 px-1">{title}</div>
    <div className="divide-y divide-white/[0.07] rounded-[20px] bg-white/[0.05] px-4">{children}</div>
  </section>
);

const SettingsSheet: React.FC<Props> = ({ open, onClose }) => {
  const { settings, update } = useSettings();
  const install = useInstallPrompt();
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => update({ [k]: v } as Partial<Settings>);

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      {!install.installed && (install.canPrompt || install.ios) && (
        <div className="mb-5 flex items-center gap-3 rounded-[20px] bg-gradient-to-br from-amber-300/25 via-orange-400/15 to-fuchsia-500/15 p-4 ring-1 ring-white/10">
          <img src="/icon.svg" alt="" className="h-12 w-12 rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold">Install BrightSide</div>
            <div className="text-[12px] leading-snug text-white/65">
              {install.ios ? (
                <>
                  Tap <Share size={12} className="inline -mt-0.5" /> then “Add to Home Screen” <PlusSquare size={12} className="inline -mt-0.5" />
                </>
              ) : (
                'Full-screen, instant launch, works offline.'
              )}
            </div>
          </div>
          {install.canPrompt && (
            <button onClick={() => install.prompt()} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-900">
              <Download size={14} /> Install
            </button>
          )}
        </div>
      )}

      <Group title="Units">
        <Row label="Temperature">
          <Segmented layoutId="set-temp" size="sm" value={settings.temp} onChange={set('temp')} options={[{ value: 'c', label: '°C' }, { value: 'f', label: '°F' }]} />
        </Row>
        <Row label="Wind">
          <Segmented
            layoutId="set-wind"
            size="sm"
            value={settings.wind}
            onChange={set('wind')}
            options={[
              { value: 'kmh', label: 'km/h' },
              { value: 'mph', label: 'mph' },
              { value: 'ms', label: 'm/s' },
              { value: 'kn', label: 'kn' },
            ]}
          />
        </Row>
        <Row label="Pressure">
          <Segmented
            layoutId="set-pressure"
            size="sm"
            value={settings.pressure}
            onChange={set('pressure')}
            options={[
              { value: 'hpa', label: 'hPa' },
              { value: 'inhg', label: 'inHg' },
              { value: 'mmhg', label: 'mmHg' },
            ]}
          />
        </Row>
        <Row label="Precipitation">
          <Segmented layoutId="set-precip" size="sm" value={settings.precip} onChange={set('precip')} options={[{ value: 'mm', label: 'mm' }, { value: 'in', label: 'in' }]} />
        </Row>
        <Row label="Distance">
          <Segmented layoutId="set-dist" size="sm" value={settings.distance} onChange={set('distance')} options={[{ value: 'km', label: 'km' }, { value: 'mi', label: 'mi' }]} />
        </Row>
      </Group>

      <Group title="Display">
        <Row label="Time format">
          <Segmented
            layoutId="set-time"
            size="sm"
            value={settings.time}
            onChange={set('time')}
            options={[
              { value: 'auto', label: <Clock size={13} className="inline -mt-0.5" /> },
              { value: '12', label: '12h' },
              { value: '24', label: '24h' },
            ]}
          />
        </Row>
        <Row label="Visual effects" hint={settings.effects === 'full' ? 'Live sky, glass blur, full particles' : 'Lighter on battery and older phones'}>
          <Segmented
            layoutId="set-fx"
            size="sm"
            value={settings.effects}
            onChange={set('effects')}
            options={[
              { value: 'full', label: <span className="inline-flex items-center gap-1"><Sparkles size={12} /> Full</span> },
              { value: 'lite', label: 'Lite' },
            ]}
          />
        </Row>
        <Row label="Haptic feedback" hint="Subtle vibrations on supported devices">
          <span className="flex items-center gap-2 text-white/40">
            <Vibrate size={15} />
            <Toggle label="Haptic feedback" on={settings.haptics} onChange={set('haptics')} />
          </span>
        </Row>
      </Group>

      <div className="flex flex-col items-center gap-3 pb-6 pt-2 text-center">
        <Logo size={44} />
        <p className="max-w-xs text-[11px] leading-relaxed text-white/40">
          Weather and air quality by OpenWeather. UV index, extended outlook and rain nowcast by{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline decoration-white/20 underline-offset-2">
            Open-Meteo
          </a>{' '}
          (CC BY 4.0).
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">BrightSide v4.0</p>
      </div>
    </Sheet>
  );
};

export default SettingsSheet;
